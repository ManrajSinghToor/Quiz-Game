package com.quizarena;

import com.quizarena.dto.QuestionDto;
import com.quizarena.security.JwtTokenProvider;
import com.quizarena.service.EmailService;
import com.quizarena.service.QuizService;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class QuizArenaApplicationTests {

    @Test
    void testPasswordEncoding() {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String rawPassword = "Password1";
        String encoded = encoder.encode(rawPassword);
        assertNotNull(encoded);
        assertTrue(encoder.matches(rawPassword, encoded));
        assertFalse(encoder.matches("WrongPassword1", encoded));
    }

    @Test
    void testJwtTokenProvider() {
        JwtTokenProvider provider = new JwtTokenProvider("supersecretkey123supersecretkey123");
        String userId = "user123456";
        String token = provider.generateToken(userId);
        assertNotNull(token);
        assertTrue(provider.validateToken(token));
        assertEquals(userId, provider.getUserIdFromToken(token));
    }

    @Test
    void testEmailDomainVerification() {
        EmailService emailService = new EmailService(null);

        // Valid domain check
        EmailService.DomainVerificationResult resValid = emailService.verifyEmailDomain("test@gmail.com");
        assertTrue(resValid.isValid());

        // Disposable check
        EmailService.DomainVerificationResult resDisposable = emailService.verifyEmailDomain("test@tempmail.com");
        assertFalse(resDisposable.isValid());

        // Invalid format
        EmailService.DomainVerificationResult resInvalid = emailService.verifyEmailDomain("invalid-email");
        assertFalse(resInvalid.isValid());
    }

    @Test
    void testQuizServiceFallbackPool() {
        QuizService quizService = new QuizService();
        List<QuestionDto> questions = quizService.generateQuestions("Operating System", "10", 5, Collections.emptyList());
        assertNotNull(questions);
        assertEquals(5, questions.size());
        for (QuestionDto q : questions) {
            assertNotNull(q.getQuestion());
            assertEquals(4, q.getOptions().size());
            assertTrue(q.getCorrectAnswer() >= 0 && q.getCorrectAnswer() < 4);
            assertEquals("Operating System", q.getCategory());
        }
    }

    @Test
    void testAllSubjectFallbacksExist() {
        QuizService quizService = new QuizService();
        String[] subjects = {
                "Operating System", "Linux", "Computer Networks", "Data Base Management System",
                "Data Structures and Algorithms", "C and Pointers", "Web Development",
                "Python Programming", "Cyber Security & Cryptography", "Cloud & DevOps",
                "Physics", "Chemistry", "Biology", "Mathematics",
                "Logical Reasoning", "Quantitative Aptitude"
        };

        for (String subject : subjects) {
            List<QuestionDto> questions = quizService.generateQuestions(subject, "10", 10, Collections.emptyList());
            assertNotNull(questions, "Questions null for subject: " + subject);
            assertEquals(10, questions.size(), "Question count mismatch for subject: " + subject);
            for (QuestionDto q : questions) {
                assertNotNull(q.getQuestion());
                assertEquals(4, q.getOptions().size());
                assertTrue(q.getCorrectAnswer() >= 0 && q.getCorrectAnswer() < 4);
                assertEquals(subject, q.getCategory());
            }
        }
    }
}

