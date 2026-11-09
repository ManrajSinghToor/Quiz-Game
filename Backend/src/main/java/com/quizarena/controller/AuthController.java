package com.quizarena.controller;

import com.quizarena.config.MongoConfig;
import com.quizarena.dto.*;
import com.quizarena.model.User;
import com.quizarena.security.UserPrincipal;
import com.quizarena.service.AuthService;
import com.quizarena.service.QuizService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final QuizService quizService;
    private final MongoConfig mongoConfig;

    public AuthController(AuthService authService, QuizService quizService, MongoConfig mongoConfig) {
        this.authService = authService;
        this.quizService = quizService;
        this.mongoConfig = mongoConfig;
    }

    private ResponseEntity<?> checkDb() {
        if (!mongoConfig.isDbConnected()) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of(
                    "message", "Database is not connected. Start MongoDB locally (mongodb://127.0.0.1:27017/quizdb) or fix MONGO_URI, then retry."
            ));
        }
        return null;
    }

    @PostMapping("/send-signup-otp")
    public ResponseEntity<?> sendSignupOtp(@RequestBody SendOtpRequest request) {
        ResponseEntity<?> dbCheck = checkDb();
        if (dbCheck != null) return dbCheck;
        return authService.sendSignupOtp(request);
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        ResponseEntity<?> dbCheck = checkDb();
        if (dbCheck != null) return dbCheck;
        return authService.register(request);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        ResponseEntity<?> dbCheck = checkDb();
        if (dbCheck != null) return dbCheck;
        return authService.login(request);
    }

    @GetMapping("/quiz-questions")
    public ResponseEntity<?> getQuizQuestions(
            @RequestParam(defaultValue = "Physics") String subject,
            @RequestParam(defaultValue = "10") String classLevel,
            @RequestParam(defaultValue = "5") int amount,
            @RequestParam(required = false) String topics
    ) {
        List<String> topicList = (topics != null && !topics.trim().isEmpty())
                ? Arrays.asList(topics.split(","))
                : Collections.emptyList();

        List<QuestionDto> questions = quizService.generateQuestions(subject, classLevel, amount, topicList);
        return ResponseEntity.ok(Map.of("questions", questions));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        ResponseEntity<?> dbCheck = checkDb();
        if (dbCheck != null) return dbCheck;
        return authService.requestPasswordReset(request);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        ResponseEntity<?> dbCheck = checkDb();
        if (dbCheck != null) return dbCheck;
        return authService.resetPasswordWithCode(request);
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(@AuthenticationPrincipal UserPrincipal principal) {
        ResponseEntity<?> dbCheck = checkDb();
        if (dbCheck != null) return dbCheck;
        if (principal == null || principal.getUser() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "User not found"));
        }
        return authService.getProfile(principal.getUser());
    }

    @PutMapping("/update-profile")
    public ResponseEntity<?> updateProfile(@AuthenticationPrincipal UserPrincipal principal,
                                           @RequestBody UpdateProfileRequest request) {
        ResponseEntity<?> dbCheck = checkDb();
        if (dbCheck != null) return dbCheck;
        if (principal == null || principal.getUser() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "User not found"));
        }
        return authService.updateProfile(principal.getUser(), request);
    }

    @PutMapping("/update-name")
    public ResponseEntity<?> updateName(@AuthenticationPrincipal UserPrincipal principal,
                                        @RequestBody UpdateNameRequest request) {
        ResponseEntity<?> dbCheck = checkDb();
        if (dbCheck != null) return dbCheck;
        if (principal == null || principal.getUser() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "User not found"));
        }
        return authService.updateName(principal.getUser(), request);
    }

    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(@AuthenticationPrincipal UserPrincipal principal,
                                            @RequestBody ChangePasswordRequest request) {
        ResponseEntity<?> dbCheck = checkDb();
        if (dbCheck != null) return dbCheck;
        if (principal == null || principal.getUser() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "User not found"));
        }
        return authService.changePassword(principal.getUser(), request);
    }

    @PostMapping("/quiz-result")
    public ResponseEntity<?> saveQuizResult(@AuthenticationPrincipal UserPrincipal principal,
                                            @RequestBody QuizResultRequest request) {
        ResponseEntity<?> dbCheck = checkDb();
        if (dbCheck != null) return dbCheck;
        if (principal == null || principal.getUser() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "User not found"));
        }
        return authService.saveQuizResult(principal.getUser(), request);
    }

    @GetMapping("/quiz-history")
    public ResponseEntity<?> getQuizHistory(@AuthenticationPrincipal UserPrincipal principal) {
        ResponseEntity<?> dbCheck = checkDb();
        if (dbCheck != null) return dbCheck;
        if (principal == null || principal.getUser() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "User not found"));
        }
        return authService.getQuizHistory(principal.getUser());
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<?> getLeaderboard(@RequestParam(defaultValue = "10") int limit) {
        ResponseEntity<?> dbCheck = checkDb();
        if (dbCheck != null) return dbCheck;
        return authService.getLeaderboard(limit);
    }
}

