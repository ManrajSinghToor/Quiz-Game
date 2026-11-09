package com.quizarena.repository;

import com.quizarena.model.QuizResult;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuizResultRepository extends MongoRepository<QuizResult, String> {

    List<QuizResult> findByUserOrderByCreatedAtDesc(String user);

    List<QuizResult> findByUserOrderByDateDesc(String user);
}

