package com.quizarena.repository;

import com.quizarena.model.Otp;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OtpRepository extends MongoRepository<Otp, String> {

    List<Otp> findByEmailIgnoreCase(String email);

    void deleteByEmailIgnoreCase(String email);
}

