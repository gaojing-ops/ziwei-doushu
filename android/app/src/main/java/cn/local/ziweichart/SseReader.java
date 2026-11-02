package cn.local.ziweichart;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.Reader;

final class SseReader {
    interface EventHandler { boolean onEvent(String data) throws Exception; }
    static void read(Reader input, EventHandler handler) throws Exception {
        BufferedReader reader = new BufferedReader(input);
        StringBuilder data = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            if (line.isEmpty()) {
                if (data.length() > 0 && !handler.onEvent(data.toString())) return;
                data.setLength(0);
            } else if (line.startsWith("data:")) {
                String part = line.substring(5);
                if (part.startsWith(" ")) part = part.substring(1);
                if (data.length() > 0) data.append('\n');
                data.append(part);
                if (data.length() > 65536) throw new IOException("Frame too large");
            }
        }
        if (data.length() > 0) handler.onEvent(data.toString());
    }
}
