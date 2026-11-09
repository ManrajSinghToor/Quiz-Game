package com.quizarena.dto;

import com.quizarena.model.QuizQuestionItem;

import java.util.List;

public class QuizResultRequest {
    private Object score;
    private Object correctAnswers;
    private Object totalQuestions;
    private String mode;
    private String clientLocalDate;
    private String subject;
    private List<String> topics;
    private List<QuizQuestionItem> questions;
    private String classLevel;

    public QuizResultRequest() {}

    public Object getScore() {
        return score;
    }

    public void setScore(Object score) {
        this.score = score;
    }

    public Object getCorrectAnswers() {
        return correctAnswers;
    }

    public void setCorrectAnswers(Object correctAnswers) {
        this.correctAnswers = correctAnswers;
    }

    public Object getTotalQuestions() {
        return totalQuestions;
    }

    public void setTotalQuestions(Object totalQuestions) {
        this.totalQuestions = totalQuestions;
    }

    public String getMode() {
        return mode;
    }

    public void setMode(String mode) {
        this.mode = mode;
    }

    public String getClientLocalDate() {
        return clientLocalDate;
    }

    public void setClientLocalDate(String clientLocalDate) {
        this.clientLocalDate = clientLocalDate;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public List<String> getTopics() {
        return topics;
    }

    public void setTopics(List<String> topics) {
        this.topics = topics;
    }

    public List<QuizQuestionItem> getQuestions() {
        return questions;
    }

    public void setQuestions(List<QuizQuestionItem> questions) {
        this.questions = questions;
    }

    public String getClassLevel() {
        return classLevel;
    }

    public void setClassLevel(String classLevel) {
        this.classLevel = classLevel;
    }
}

