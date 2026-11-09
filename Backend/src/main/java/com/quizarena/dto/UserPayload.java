package com.quizarena.dto;

import com.quizarena.model.User;

import java.util.Map;

public class UserPayload {
    private String id;
    private String name;
    private String email;
    private int avatar;
    private String lastDailyQuizDate;
    private Map<String, Object> lastDailyQuizResult;

    public UserPayload() {}

    public UserPayload(User user) {
        if (user != null) {
            this.id = user.getId();
            this.name = user.getName();
            this.email = user.getEmail();
            this.avatar = user.getAvatar();
            this.lastDailyQuizDate = user.getLastDailyQuizDate();
            this.lastDailyQuizResult = user.getLastDailyQuizResult();
        }
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

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

    public int getAvatar() {
        return avatar;
    }

    public void setAvatar(int avatar) {
        this.avatar = avatar;
    }

    public String getLastDailyQuizDate() {
        return lastDailyQuizDate;
    }

    public void setLastDailyQuizDate(String lastDailyQuizDate) {
        this.lastDailyQuizDate = lastDailyQuizDate;
    }

    public Map<String, Object> getLastDailyQuizResult() {
        return lastDailyQuizResult;
    }

    public void setLastDailyQuizResult(Map<String, Object> lastDailyQuizResult) {
        this.lastDailyQuizResult = lastDailyQuizResult;
    }
}

