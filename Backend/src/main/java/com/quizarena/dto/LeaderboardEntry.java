package com.quizarena.dto;

public class LeaderboardEntry {
    private int rank;
    private String name;
    private int score;
    private int quizzes;
    private int correctAnswers;
    private int accuracy;
    private int avatar;

    public LeaderboardEntry() {}

    public LeaderboardEntry(int rank, String name, int score, int quizzes, int correctAnswers, int accuracy, int avatar) {
        this.rank = rank;
        this.name = name;
        this.score = score;
        this.quizzes = quizzes;
        this.correctAnswers = correctAnswers;
        this.accuracy = accuracy;
        this.avatar = avatar;
    }

    public int getRank() {
        return rank;
    }

    public void setRank(int rank) {
        this.rank = rank;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public int getScore() {
        return score;
    }

    public void setScore(int score) {
        this.score = score;
    }

    public int getQuizzes() {
        return quizzes;
    }

    public void setQuizzes(int quizzes) {
        this.quizzes = quizzes;
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

    public int getAvatar() {
        return avatar;
    }

    public void setAvatar(int avatar) {
        this.avatar = avatar;
    }
}

