package cn.local.ziweichart;

import android.content.Context;
import android.content.SharedPreferences;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.SocketTimeoutException;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.Executors;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import javax.net.ssl.HttpsURLConnection;
import org.json.JSONArray;
import org.json.JSONObject;

@CapacitorPlugin(name = "DeepSeek")
public class DeepSeekPlugin extends Plugin {
    private static final String ENDPOINT = "https://api.deepseek.com/chat/completions";
    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private final ScheduledExecutorService timer = Executors.newSingleThreadScheduledExecutor();
    private final AtomicReference<Job> active = new AtomicReference<>();
    private SecureApiKeyStore vault;
    private SharedPreferences prefs;
    private static final class Job {
        final String id;
        volatile boolean cancelled, timedOut;
        volatile HttpsURLConnection connection;
        Job(String id) { this.id = id; }
        void stop() { cancelled = true; HttpsURLConnection c = connection; if (c != null) c.disconnect(); }
    }
    @Override public void load() {
        vault = new SecureApiKeyStore(getContext());
        prefs = getContext().getSharedPreferences("deepseek_settings", Context.MODE_PRIVATE);
    }
    private boolean validModel(String model) { return "deepseek-flash".equals(model) || "deepseek-v4-pro".equals(model); }
    private JSObject settings() {
        JSObject result = new JSObject();
        result.put("configured", vault.hasKey() && prefs.getBoolean("consent", false));
        result.put("model", prefs.getString("model", "deepseek-flash"));
        result.put("maxTokens", prefs.getInt("maxTokens", 2048));
        result.put("consent", prefs.getBoolean("consent", false));
        return result;
    }
    @PluginMethod public void getSettings(PluginCall call) { call.resolve(settings()); }
    @PluginMethod public void saveSettings(PluginCall call) {
        String model = call.getString("model", "deepseek-flash");
        int maxTokens = call.getInt("maxTokens", 2048);
        String key = call.getString("apiKey", "").trim();
        if (!validModel(model) || (maxTokens != 1024 && maxTokens != 2048) || !call.getBoolean("consent", false)) {
            call.reject("Invalid settings", "INVALID_REQUEST"); return;
        }
        if ((!key.isEmpty() && !key.matches("[A-Za-z0-9_-]{12,256}")) || (key.isEmpty() && !vault.hasKey())) {
            call.reject("Invalid key", "INVALID_KEY"); return;
        }
        Job job = active.get(); if (job != null) job.stop();
        try {
            if (!key.isEmpty()) vault.save(key);
            if (!prefs.edit().putString("model", model).putInt("maxTokens", maxTokens).putBoolean("consent", true).commit()) throw new Exception();
            call.resolve(settings());
        } catch (Exception error) { call.reject("Encrypted storage unavailable", "SECURE_STORAGE"); }
    }
    @PluginMethod public void clearKey(PluginCall call) {
        Job job = active.get(); if (job != null) job.stop();
        try { vault.clear(); prefs.edit().clear().commit(); call.resolve(settings()); }
        catch (Exception error) { call.reject("Encrypted storage unavailable", "SECURE_STORAGE"); }
    }
    @PluginMethod public void cancel(PluginCall call) {
        Job job = active.get();
        if (job != null && job.id.equals(call.getString("requestId", ""))) job.stop();
        call.resolve();
    }
    @PluginMethod public void interpret(PluginCall call) {
        String id = call.getString("requestId", "");
        JSArray messages = call.getArray("messages");
        if (!vault.hasKey() || !prefs.getBoolean("consent", false)) { call.reject("Configure key first", "KEY_MISSING"); return; }
        try {
            if (!id.matches("[A-Za-z0-9-]{1,80}") || messages == null || messages.length() < 2 || messages.length() > 12) throw new Exception();
            int chars = 0;
            for (int i = 0; i < messages.length(); i++) {
                JSONObject message = messages.getJSONObject(i);
                String role = message.getString("role"), content = message.getString("content");
                if (!(role.equals("system") || role.equals("user") || role.equals("assistant")) || content.isEmpty() || content.length() > 18000) throw new Exception();
                if ((i == 0 && !role.equals("system")) || (i > 0 && role.equals("system"))) throw new Exception();
                chars += content.length();
            }
            if (chars > 60000) throw new Exception();
        } catch (Exception error) { call.reject("Invalid request", "INVALID_REQUEST"); return; }
        Job job = new Job(id);
        if (!active.compareAndSet(null, job)) { call.reject("Request already active", "BUSY"); return; }
        executor.execute(() -> runRequest(call, job, messages));
    }
    private void runRequest(PluginCall call, Job job, JSONArray messages) {
        ScheduledFuture<?> deadline = timer.schedule(() -> { job.timedOut = true; job.stop(); }, 120, TimeUnit.SECONDS);
        StringBuilder text = new StringBuilder();
        try {
            if (job.cancelled) throw new InterruptedException();
            String key;
            try { key = vault.read(); } catch (Exception error) { call.reject("Encrypted storage unavailable", "SECURE_STORAGE"); return; }
            String model = prefs.getString("model", "deepseek-flash");
            if (!validModel(model)) { call.reject("Unsupported model", "MODEL"); return; }
            JSONObject payload = new JSONObject().put("model", model).put("messages", messages).put("stream", true)
                .put("thinking", new JSONObject().put("type", "disabled")).put("max_tokens", prefs.getInt("maxTokens", 2048));
            HttpsURLConnection connection = (HttpsURLConnection) new URL(ENDPOINT).openConnection();
            job.connection = connection;
            connection.setInstanceFollowRedirects(false);
            connection.setConnectTimeout(20000); connection.setReadTimeout(45000);
            connection.setRequestMethod("POST"); connection.setDoOutput(true);
            connection.setRequestProperty("Content-Type", "application/json");
            connection.setRequestProperty("Accept", "text/event-stream");
            connection.setRequestProperty("Authorization", "Bearer " + key);
            byte[] body = payload.toString().getBytes(StandardCharsets.UTF_8);
            connection.setFixedLengthStreamingMode(body.length);
            if (job.cancelled) throw new InterruptedException();
            try (OutputStream output = connection.getOutputStream()) { output.write(body); }
            int status = connection.getResponseCode();
            if (job.cancelled) throw new InterruptedException();
            if (status != 200) {
                String code = status == 401 ? "AUTH" : status == 402 ? "BALANCE" : status == 429 ? "RATE_LIMIT"
                    : status == 400 || status == 422 ? "MODEL" : status >= 500 ? "SERVER" : "NETWORK";
                call.reject("DeepSeek request failed", code); return;
            }
            final boolean[] done = { false };
            final String[] finishReason = { "" };
            final JSONObject[] usage = { null };
            try (InputStreamReader reader = new InputStreamReader(connection.getInputStream(), StandardCharsets.UTF_8)) {
                SseReader.read(reader, data -> {
                    if (job.cancelled) throw new InterruptedException();
                    if (data.trim().equals("[DONE]")) { done[0] = true; return false; }
                    JSONObject event = new JSONObject(data);
                    if (event.has("error")) throw new java.io.IOException("Provider error");
                    if (!event.isNull("usage")) usage[0] = event.optJSONObject("usage");
                    JSONArray choices = event.optJSONArray("choices");
                    if (choices != null && choices.length() > 0) {
                        JSONObject choice = choices.getJSONObject(0);
                        if (!choice.isNull("finish_reason")) finishReason[0] = choice.optString("finish_reason", "");
                        JSONObject delta = choice.optJSONObject("delta");
                        String part = delta == null || delta.isNull("content") ? "" : delta.optString("content", "");
                        if (!part.isEmpty()) {
                            text.append(part);
                            if (text.length() > 30000) throw new java.io.IOException("Response too large");
                            JSObject chunk = new JSObject(); chunk.put("requestId", job.id); chunk.put("text", part);
                            notifyListeners("deepseekChunk", chunk);
                        }
                    }
                    return true;
                });
            }
            if (job.cancelled) throw new InterruptedException();
            if (!done[0] || text.toString().trim().isEmpty()) { call.reject("Incomplete response", "INCOMPLETE"); return; }
            JSObject result = new JSObject(); result.put("text", text.toString()); result.put("finishReason", finishReason[0]);
            if (usage[0] != null) { result.put("promptTokens", usage[0].optInt("prompt_tokens")); result.put("completionTokens", usage[0].optInt("completion_tokens")); }
            call.resolve(result);
        } catch (Exception error) {
            call.reject("Request not completed", job.timedOut ? "TIMEOUT" : job.cancelled ? "CANCELLED" : error instanceof SocketTimeoutException ? "TIMEOUT" : "NETWORK");
        } finally {
            deadline.cancel(false);
            if (job.connection != null) job.connection.disconnect();
            active.compareAndSet(job, null);
        }
    }
    @Override protected void handleOnDestroy() {
        Job job = active.get(); if (job != null) job.stop();
        executor.shutdownNow(); timer.shutdownNow();
        super.handleOnDestroy();
    }
}
