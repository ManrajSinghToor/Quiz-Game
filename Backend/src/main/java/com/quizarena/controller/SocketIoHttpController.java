package com.quizarena.controller;

import io.socket.engineio.server.EngineIoServer;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

import java.io.IOException;

@Controller
public class SocketIoHttpController {

    private final EngineIoServer engineIoServer;

    public SocketIoHttpController(EngineIoServer engineIoServer) {
        this.engineIoServer = engineIoServer;
    }

    @RequestMapping(
            value = "/socket.io/",
            method = {RequestMethod.GET, RequestMethod.POST, RequestMethod.OPTIONS},
            headers = "Connection!=Upgrade"
    )
    public void handleHttp(HttpServletRequest request, HttpServletResponse response) throws IOException {
        engineIoServer.handleRequest(request, response);
    }
}

