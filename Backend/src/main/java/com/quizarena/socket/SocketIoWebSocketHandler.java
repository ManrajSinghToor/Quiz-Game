package com.quizarena.socket;

import io.socket.engineio.server.EngineIoServer;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.List;
import java.util.Map;

@Component
public class SocketIoWebSocketHandler implements WebSocketHandler, HandshakeInterceptor {

    private static final String ATTR_QUERY = "engineIo.query";
    private static final String ATTR_HEADERS = "engineIo.headers";
    private static final String ATTR_WRAPPER = "engineIo.wrapper";

    private final EngineIoServer engineIoServer;

    public SocketIoWebSocketHandler(EngineIoServer engineIoServer) {
        this.engineIoServer = engineIoServer;
    }

    // HandshakeInterceptor
    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                   WebSocketHandler wsHandler, Map<String, Object> attributes) {
        attributes.put(ATTR_QUERY, request.getURI().getQuery());
        attributes.put(ATTR_HEADERS, request.getHeaders());
        return true;
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                               WebSocketHandler wsHandler, Exception exception) {
    }

    // WebSocketHandler
    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        String query = (String) session.getAttributes().get(ATTR_QUERY);
        @SuppressWarnings("unchecked")
        Map<String, List<String>> headers = (Map<String, List<String>>) session.getAttributes().get(ATTR_HEADERS);

        EngineIoSpringWebSocket wrapper = new EngineIoSpringWebSocket(session, query, headers);
        session.getAttributes().put(ATTR_WRAPPER, wrapper);
        engineIoServer.handleWebSocket(wrapper);
    }

    @Override
    public void handleMessage(WebSocketSession session, WebSocketMessage<?> message) {
        EngineIoSpringWebSocket wrapper = (EngineIoSpringWebSocket) session.getAttributes().get(ATTR_WRAPPER);
        if (wrapper != null) {
            if (message instanceof TextMessage textMessage) {
                wrapper.emit("message", (Object) textMessage.getPayload());
            } else if (message instanceof BinaryMessage binaryMessage) {
                wrapper.emit("message", (Object) binaryMessage.getPayload().array());
            }
        }
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        EngineIoSpringWebSocket wrapper = (EngineIoSpringWebSocket) session.getAttributes().get(ATTR_WRAPPER);
        if (wrapper != null) {
            wrapper.emit("error", "Transport error", exception);
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus closeStatus) {
        EngineIoSpringWebSocket wrapper = (EngineIoSpringWebSocket) session.getAttributes().get(ATTR_WRAPPER);
        if (wrapper != null) {
            wrapper.emit("close");
        }
    }

    @Override
    public boolean supportsPartialMessages() {
        return false;
    }
}

