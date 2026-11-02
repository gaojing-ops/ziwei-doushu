package cn.local.ziweichart;

import org.junit.Test;
import java.io.ByteArrayInputStream;
import java.io.InputStreamReader;
import java.io.StringReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import static org.junit.Assert.*;

public class SseReaderTest {
    @Test public void handlesOneByteUtf8ReadsAndCrLf() throws Exception {
        byte[] bytes = ": keepalive\r\ndata: {\"content\":\"你好\"}\r\n\r\ndata: [DONE]\r\n\r\ndata: ignored\n\n".getBytes(StandardCharsets.UTF_8);
        ByteArrayInputStream fragmented = new ByteArrayInputStream(bytes) {
            @Override public synchronized int read(byte[] buffer, int offset, int length) { return super.read(buffer, offset, Math.min(1, length)); }
        };
        List<String> events = new ArrayList<>();
        SseReader.read(new InputStreamReader(fragmented, StandardCharsets.UTF_8), data -> { events.add(data); return !data.equals("[DONE]"); });
        assertEquals(Arrays.asList("{\"content\":\"你好\"}", "[DONE]"), events);
    }
    @Test public void joinsDataLinesAndFlushesFinalEvent() throws Exception {
        List<String> events = new ArrayList<>();
        SseReader.read(new StringReader("event: message\ndata: first\ndata: second\n\ndata:last"), data -> { events.add(data); return true; });
        assertEquals(Arrays.asList("first\nsecond", "last"), events);
    }
    @Test public void rejectsOversizedFrames() throws Exception {
        try {
            SseReader.read(new StringReader("data: " + new String(new char[65537]).replace('\0', 'x')), data -> true);
            fail("Should reject oversized frames");
        } catch (java.io.IOException expected) { assertTrue(expected.getMessage().contains("large")); }
    }
}
