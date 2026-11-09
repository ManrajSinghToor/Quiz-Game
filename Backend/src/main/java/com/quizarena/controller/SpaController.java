package com.quizarena.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import java.io.File;

@Controller
public class SpaController {

    private File getDistIndexFile() {
        File[] candidates = new File[]{
                new File("../Frontend/dist/index.html"),
                new File("Frontend/dist/index.html"),
                new File("./Frontend/dist/index.html"),
                new File("dist/index.html")
        };
        for (File f : candidates) {
            if (f.exists() && f.isFile()) {
                return f;
            }
        }
        return null;
    }

    @GetMapping(value = {"/{path:[^\\.]*}", "/**/{path:[^\\.]*}"})
    @ResponseBody
    public ResponseEntity<?> forwardToIndex(HttpServletRequest request) {
        String uri = request.getRequestURI();
        if (uri.startsWith("/api") || uri.startsWith("/socket.io")) {
            return ResponseEntity.status(404).body("{\"message\":\"API route not found\"}");
        }

        File indexFile = getDistIndexFile();
        if (indexFile != null) {
            Resource resource = new FileSystemResource(indexFile);
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(resource);
        }

        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_HTML)
                .body("QuizArena Backend API is running. (Frontend build pending)");
    }
}

