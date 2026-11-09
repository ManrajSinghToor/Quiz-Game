package com.quizarena.dto;

public class SendOtpRequest {
    private String name;
    private String email;

    public SendOtpRequest() {}

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}

