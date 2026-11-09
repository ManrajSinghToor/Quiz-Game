package com.quizarena.dto;

import java.util.Map;

public class UserStatsDto {
    private int totalScore;
    private int totalQuizzes;
    private int totalQuestions;
    private int correctAnswers;
    private int accuracy;
    private int currentStreak;
    private String lastDailyQuizDate;
    private Map<String, Object> lastDailyQuizResult;

    public UserStatsDto() {}

    public UserStatsDto(int totalScore, int totalQuizzes, int totalQuestions, int correctAnswers, int accuracy, int currentStreak, String lastDailyQuizDate, Map<String, Object> lastDailyQuizResult) {
        this.totalScore = totalScore;
        this.totalQuizzes = totalQuizzes;
        this.totalQuestions = totalQuestions;
        this.correctAnswers = correctAnswers;
        this.accuracy = accuracy;
        this.currentStreak = currentStreak;
        this.lastDailyQuizDate = lastDailyQuizDate;
        this.lastDailyQuizResult = lastDailyQuizResult;
    }

    public int getTotalScore() {
        return totalScore;
    }

    public void setTotalScore(int totalScore) {
        this.totalScore = totalScore;
    }

    public int getTotalQuizzes() {
        return totalQuizzes;
    }

    public void setTotalQuizzes(int totalQuizzes) {
        this.totalQuizzes = totalQuizzes;
    }

    public int getTotalQuestions() {
        return totalQuestions;
    }

    public void setTotalQuestions(int totalQuestions) {
        this.totalQuestions = totalQuestions;
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

    public int getCurrentStreak() {
        return currentStreak;
    }

    public void setCurrentStreak(int currentStreak) {
        this.currentStreak = currentStreak;
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

