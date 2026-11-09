package com.quizarena.dto;

public class AuthResponse {
    private String message;
    private String token;
    private UserPayload user;

    public AuthResponse() {}

    public AuthResponse(String message, String token, UserPayload user) {
        this.message = message;
        this.token = token;
        this.user = user;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public UserPayload getUser() {
        return user;
    }

    public void setUser(UserPayload user) {
        this.user = user;
    }
}

