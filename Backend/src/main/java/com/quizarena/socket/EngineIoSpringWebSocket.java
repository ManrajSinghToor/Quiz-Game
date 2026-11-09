package com.quizarena.socket;

import io.socket.engineio.server.EngineIoWebSocket;
import io.socket.engineio.server.utils.ParseQS;
import org.springframework.web.socket.BinaryMessage;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class EngineIoSpringWebSocket extends EngineIoWebSocket {

    private final WebSocketSession session;
    private final Map<String, String> query;
    private final Map<String, List<String>> connectionHeaders;

    public EngineIoSpringWebSocket(WebSocketSession session, String queryString, Map<String, List<String>> headers) {
        this.session = session;
        this.query = queryString != null ? ParseQS.decode(queryString) : Collections.emptyMap();
        this.connectionHeaders = headers != null ? headers : Collections.emptyMap();
    }

    @Override
    public Map<String, String> getQuery() {
        return query;
    }

    @Override
    public Map<String, List<String>> getConnectionHeaders() {
        return connectionHeaders;
    }

    @Override
    public void write(String message) throws IOException {
        if (session.isOpen()) {
            synchronized (session) {
                session.sendMessage(new TextMessage(message));
            }
        }
    }

    @Override
    public void write(byte[] message) throws IOException {
        if (session.isOpen()) {
            synchronized (session) {
                session.sendMessage(new BinaryMessage(ByteBuffer.wrap(message)));
            }
        }
    }

    @Override
    public void close() {
        try {
            if (session.isOpen()) {
                session.close();
            }
        } catch (IOException e) {
            // Ignore
        }
    }
}

