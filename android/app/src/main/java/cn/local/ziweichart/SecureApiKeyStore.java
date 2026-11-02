package cn.local.ziweichart;

import android.content.Context;
import android.content.SharedPreferences;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

final class SecureApiKeyStore {
    private static final String ALIAS = "ziwei.deepseek.key.v1";
    private final SharedPreferences prefs;
    SecureApiKeyStore(Context context) { prefs = context.getSharedPreferences("deepseek_secure", Context.MODE_PRIVATE); }
    boolean hasKey() { return prefs.contains("ciphertext") && prefs.contains("iv"); }
    private KeyStore keyStore() throws Exception { KeyStore ks = KeyStore.getInstance("AndroidKeyStore"); ks.load(null); return ks; }
    private SecretKey key(boolean create) throws Exception {
        KeyStore ks = keyStore();
        if (ks.containsAlias(ALIAS)) return (SecretKey) ks.getKey(ALIAS, null);
        if (!create) throw new IllegalStateException("Missing encryption key");
        KeyGenerator generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore");
        generator.init(new KeyGenParameterSpec.Builder(ALIAS, KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
            .setKeySize(256).build());
        return generator.generateKey();
    }
    synchronized void save(String value) throws Exception {
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.ENCRYPT_MODE, key(true));
        byte[] encrypted = cipher.doFinal(value.getBytes(StandardCharsets.UTF_8));
        if (!prefs.edit().putString("ciphertext", Base64.encodeToString(encrypted, Base64.NO_WRAP))
            .putString("iv", Base64.encodeToString(cipher.getIV(), Base64.NO_WRAP)).commit()) throw new IllegalStateException("Save failed");
    }
    synchronized String read() throws Exception {
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.DECRYPT_MODE, key(false), new GCMParameterSpec(128, Base64.decode(prefs.getString("iv", ""), Base64.NO_WRAP)));
        return new String(cipher.doFinal(Base64.decode(prefs.getString("ciphertext", ""), Base64.NO_WRAP)), StandardCharsets.UTF_8);
    }
    synchronized void clear() throws Exception {
        if (!prefs.edit().clear().commit()) throw new IllegalStateException("Clear failed");
        keyStore().deleteEntry(ALIAS);
    }
}
