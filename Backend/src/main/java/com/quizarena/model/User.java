package com.quizarena.model;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.Map;

@Document(collection = "users")
public class User {

    @Id
    private String id;

    @Indexed
    private String name;

    @Indexed(unique = true)
    private String email;

    private String password;

    private int avatar = 0;
    private int totalScore = 0;
    private int totalQuestions = 0;
    private int prevTotalScore = 0;
    private int totalQuizzes = 0;
    private int correctAnswers = 0;
    private int accuracy = 0;
    private int prevAccuracy = 0;
    private int currentStreak = 0;

    private Instant lastQuizDate;
    private String lastQuizLocalDate;
    private String lastDailyQuizDate;
    private Map<String, Object> lastDailyQuizResult;

    private String passwordResetCodeHash;
    private Instant passwordResetCodeExpiresAt;

    @CreatedDate
    private Instant createdAt = Instant.now();

    @LastModifiedDate
    private Instant updatedAt = Instant.now();

    public User() {}

    public User(String name, String email, String password) {
        this.name = name;
        this.email = email;
        this.password = password;
        this.avatar = 0;
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

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public int getAvatar() {
        return avatar;
    }

    public void setAvatar(int avatar) {
        this.avatar = avatar;
    }

    public int getTotalScore() {
        return totalScore;
    }

    public void setTotalScore(int totalScore) {
        this.totalScore = totalScore;
    }

    public int getTotalQuestions() {
        return totalQuestions;
    }

    public void setTotalQuestions(int totalQuestions) {
        this.totalQuestions = totalQuestions;
    }

    public int getPrevTotalScore() {
        return prevTotalScore;
    }

    public void setPrevTotalScore(int prevTotalScore) {
        this.prevTotalScore = prevTotalScore;
    }

    public int getTotalQuizzes() {
        return totalQuizzes;
    }

    public void setTotalQuizzes(int totalQuizzes) {
        this.totalQuizzes = totalQuizzes;
    }

    public int getCorrectAnswers() {
        return correctAnswers;
    }

    public void setCorrectAnswers(int correctAnswers) {
        this.correctAnswers = correctAnswers;
    }

    public int getAccuracy() {
        return accuracy;
    }

    public void setAccuracy(int accuracy) {
        this.accuracy = accuracy;
    }

    public int getPrevAccuracy() {
        return prevAccuracy;
    }

    public void setPrevAccuracy(int prevAccuracy) {
        this.prevAccuracy = prevAccuracy;
    }

    public int getCurrentStreak() {
        return currentStreak;
    }

    public void setCurrentStreak(int currentStreak) {
        this.currentStreak = currentStreak;
    }

    public Instant getLastQuizDate() {
        return lastQuizDate;
    }

    public void setLastQuizDate(Instant lastQuizDate) {
        this.lastQuizDate = lastQuizDate;
    }

    public String getLastQuizLocalDate() {
        return lastQuizLocalDate;
    }

    public void setLastQuizLocalDate(String lastQuizLocalDate) {
        this.lastQuizLocalDate = lastQuizLocalDate;
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

    public String getPasswordResetCodeHash() {
        return passwordResetCodeHash;
    }

    public void setPasswordResetCodeHash(String passwordResetCodeHash) {
        this.passwordResetCodeHash = passwordResetCodeHash;
    }

    public Instant getPasswordResetCodeExpiresAt() {
        return passwordResetCodeExpiresAt;
    }

    public void setPasswordResetCodeExpiresAt(Instant passwordResetCodeExpiresAt) {
        this.passwordResetCodeExpiresAt = passwordResetCodeExpiresAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}

