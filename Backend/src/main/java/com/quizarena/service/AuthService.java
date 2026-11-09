package com.quizarena.service;

import com.quizarena.dto.*;
import com.quizarena.model.Otp;
import com.quizarena.model.QuizResult;
import com.quizarena.model.User;
import com.quizarena.repository.OtpRepository;
import com.quizarena.repository.QuizResultRepository;
import com.quizarena.repository.UserRepository;
import com.quizarena.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.regex.Pattern;

@Service
public class AuthService {

    private static final Pattern PASSWORD_PATTERN = Pattern.compile("^(?=.*[A-Z])(?=.*\\d).{8,}$");
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

    private final UserRepository userRepository;
    private final QuizResultRepository quizResultRepository;
    private final OtpRepository otpRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final EmailService emailService;
    private final SocketService socketService;

    @Value("${jwt.secret:supersecretkey123}")
    private String jwtSecret;

    public AuthService(UserRepository userRepository,
                       QuizResultRepository quizResultRepository,
                       OtpRepository otpRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider tokenProvider,
                       EmailService emailService,
                       SocketService socketService) {
        this.userRepository = userRepository;
        this.quizResultRepository = quizResultRepository;
        this.otpRepository = otpRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
        this.emailService = emailService;
        this.socketService = socketService;
    }

    private String hashResetCode(String email, String code) {
        try {
            String secret = (jwtSecret != null && !jwtSecret.trim().isEmpty()) ? jwtSecret : "dev";
            String raw = email.toLowerCase().trim() + ":" + code + ":" + secret;
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(raw.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("Hashing failed", e);
        }
    }

    public ResponseEntity<?> sendSignupOtp(SendOtpRequest request) {
        if (request == null || request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email is required"));
        }

        String cleanEmail = request.getEmail().trim().toLowerCase();
        String cleanName = (request.getName() != null && !request.getName().trim().isEmpty())
                ? request.getName().trim() : "Player";

        if (!EMAIL_PATTERN.matcher(cleanEmail).matches()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Please enter a valid email address"));
        }

        EmailService.DomainVerificationResult verification = emailService.verifyEmailDomain(cleanEmail);
        if (!verification.isValid()) {
            return ResponseEntity.badRequest().body(Map.of("message", verification.getReason()));
        }

        if (userRepository.existsByEmailIgnoreCase(cleanEmail)) {
            return ResponseEntity.badRequest().body(Map.of("message", "User already exists with this email"));
        }

        String otpCode = String.valueOf(100000 + new Random().nextInt(900000));

        try {
            emailService.sendOtpEmail(cleanEmail, cleanName, otpCode);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message",
                    "Failed to send email to '" + cleanEmail + "': " + (e.getMessage() != null ? e.getMessage() : "Connection timeout") + ". Please try again."));
        }

        otpRepository.deleteByEmailIgnoreCase(cleanEmail);
        Otp otp = new Otp(cleanEmail, otpCode, Instant.now().plus(10, ChronoUnit.MINUTES));
        otpRepository.save(otp);

        return ResponseEntity.ok(Map.of("message", "Verification code sent to " + cleanEmail));
    }

    public ResponseEntity<?> register(RegisterRequest request) {
        if (request == null || request.getName() == null || request.getEmail() == null || request.getPassword() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "All fields are required"));
        }

        String cleanName = request.getName().trim();
        String cleanEmail = request.getEmail().trim().toLowerCase();
        String password = request.getPassword();

        if (cleanName.isEmpty() || cleanEmail.isEmpty() || password.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "All fields are required"));
        }

        if (!EMAIL_PATTERN.matcher(cleanEmail).matches()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Please enter a valid email address"));
        }

        if (!PASSWORD_PATTERN.matcher(password).matches()) {
            return ResponseEntity.badRequest().body(Map.of("message",
                    "Password must be at least 8 characters, contain 1 uppercase letter and 1 number"));
        }

        if (userRepository.existsByNameIgnoreCase(cleanName)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Username already taken"));
        }

        if (userRepository.existsByEmailIgnoreCase(cleanEmail)) {
            return ResponseEntity.badRequest().body(Map.of("message", "User already exists with this email"));
        }

        String hashedPassword = passwordEncoder.encode(password);
        User user = new User(cleanName, cleanEmail, hashedPassword);
        user = userRepository.save(user);

        emailService.sendWelcomeEmail(cleanEmail, cleanName);

        String token = tokenProvider.generateToken(user.getId());

        return ResponseEntity.status(HttpStatus.CREATED).body(
                new AuthResponse("User registered successfully", token, new UserPayload(user))
        );
    }

    public ResponseEntity<?> login(LoginRequest request) {
        if (request == null || request.getEmail() == null || request.getPassword() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email and password are required"));
        }

        String cleanInput = request.getEmail().trim();
        if (cleanInput.isEmpty() || request.getPassword().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email and password are required"));
        }

        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(cleanInput);
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByNameIgnoreCase(cleanInput);
        }

        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Don't Have an Account"));
        }

        User user = userOpt.get();
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid credentials"));
        }

        String token = tokenProvider.generateToken(user.getId());
        return ResponseEntity.ok(new AuthResponse("Login successful", token, new UserPayload(user)));
    }

    public ResponseEntity<?> getProfile(User user) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", user.getId());
        map.put("name", user.getName());
        map.put("email", user.getEmail());
        map.put("avatar", user.getAvatar());
        map.put("createdAt", user.getCreatedAt());
        map.put("totalScore", user.getTotalScore());
        map.put("prevTotalScore", user.getPrevTotalScore());
        map.put("totalQuizzes", user.getTotalQuizzes());
        map.put("totalQuestions", user.getTotalQuestions());
        map.put("correctAnswers", user.getCorrectAnswers());
        map.put("accuracy", user.getAccuracy());
        map.put("prevAccuracy", user.getPrevAccuracy());
        map.put("currentStreak", user.getCurrentStreak());
        map.put("lastQuizDate", user.getLastQuizDate());
        map.put("lastQuizLocalDate", user.getLastQuizLocalDate());
        map.put("lastDailyQuizDate", user.getLastDailyQuizDate());
        map.put("lastDailyQuizResult", user.getLastDailyQuizResult());

        return ResponseEntity.ok(map);
    }

    public ResponseEntity<?> updateProfile(User user, UpdateProfileRequest request) {
        if (request != null && request.getAvatar() != null) {
            try {
                int avatarNum = Integer.parseInt(String.valueOf(request.getAvatar()));
                if (avatarNum < 0 || avatarNum > 11) {
                    return ResponseEntity.badRequest().body(Map.of("message", "Avatar index must be between 0 and 11"));
                }
                user.setAvatar(avatarNum);
                user.setUpdatedAt(Instant.now());
                user = userRepository.save(user);
            } catch (NumberFormatException e) {
                return ResponseEntity.badRequest().body(Map.of("message", "Avatar index must be between 0 and 11"));
            }
        }

        return ResponseEntity.ok(Map.of(
                "message", "Profile updated successfully",
                "user", new UserPayload(user)
        ));
    }

    public ResponseEntity<?> updateName(User user, UpdateNameRequest request) {
        if (request == null || request.getName() == null || request.getName().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Name is required"));
        }

        String newName = request.getName().trim();
        if (userRepository.existsByNameIgnoreCaseAndIdNot(newName, user.getId())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Username already taken"));
        }

        user.setName(newName);
        user.setUpdatedAt(Instant.now());
        user = userRepository.save(user);

        return ResponseEntity.ok(Map.of(
                "message", "Name updated successfully",
                "name", user.getName(),
                "user", new UserPayload(user)
        ));
    }

    public ResponseEntity<?> changePassword(User user, ChangePasswordRequest request) {
        if (request == null || request.getPassword() == null || request.getPassword().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Password is required"));
        }

        if (!PASSWORD_PATTERN.matcher(request.getPassword()).matches()) {
            return ResponseEntity.badRequest().body(Map.of("message",
                    "Password must be at least 8 characters, contain 1 uppercase letter and 1 number"));
        }

        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Password updated successfully"));
    }

    public ResponseEntity<?> getLeaderboard(int limit) {
        int effLimit = limit > 0 ? limit : 10;
        List<User> users = userRepository.findAllByOrderByTotalScoreDesc(PageRequest.of(0, effLimit));
        List<LeaderboardEntry> leaderboard = new ArrayList<>();

        for (int i = 0; i < users.size(); i++) {
            User u = users.get(i);
            leaderboard.add(new LeaderboardEntry(
                    i + 1,
                    u.getName(),
                    u.getTotalScore(),
                    u.getTotalQuizzes(),
                    u.getCorrectAnswers(),
                    u.getAccuracy(),
                    u.getAvatar()
            ));
        }

        return ResponseEntity.ok(leaderboard);
    }

    public ResponseEntity<?> requestPasswordReset(ForgotPasswordRequest request) {
        if (request == null || request.getEmail() == null || !EMAIL_PATTERN.matcher(request.getEmail().trim()).matches()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Please enter a valid email address"));
        }

        String cleanEmail = request.getEmail().trim().toLowerCase();
        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(cleanEmail);
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "No account found with this email address"));
        }

        User user = userOpt.get();
        String code = String.valueOf(100000 + new Random().nextInt(900000));
        user.setPasswordResetCodeHash(hashResetCode(cleanEmail, code));
        user.setPasswordResetCodeExpiresAt(Instant.now().plus(10, ChronoUnit.MINUTES));
        userRepository.save(user);

        emailService.sendPasswordResetEmail(cleanEmail, user.getName(), code);

        return ResponseEntity.ok(Map.of("message", "Password reset code sent to " + cleanEmail + ". Please check your inbox."));
    }

    public ResponseEntity<?> resetPasswordWithCode(ResetPasswordRequest request) {
        if (request == null || request.getEmail() == null || !EMAIL_PATTERN.matcher(request.getEmail().trim()).matches()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Please enter a valid email address"));
        }

        if (request.getCode() == null || request.getCode().trim().length() != 6) {
            return ResponseEntity.badRequest().body(Map.of("message", "Reset code must be 6 digits"));
        }

        if (request.getNewPassword() == null || !PASSWORD_PATTERN.matcher(request.getNewPassword()).matches()) {
            return ResponseEntity.badRequest().body(Map.of("message",
                    "Password must be at least 8 characters, contain 1 uppercase letter and 1 number"));
        }

        String cleanEmail = request.getEmail().trim().toLowerCase();
        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(cleanEmail);
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid reset code"));
        }

        User user = userOpt.get();
        if (user.getPasswordResetCodeHash() == null || user.getPasswordResetCodeExpiresAt() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "No active reset request. Please request a new code."));
        }

        if (user.getPasswordResetCodeExpiresAt().isBefore(Instant.now())) {
            user.setPasswordResetCodeHash(null);
            user.setPasswordResetCodeExpiresAt(null);
            userRepository.save(user);
            return ResponseEntity.badRequest().body(Map.of("message", "Reset code expired. Please request a new code."));
        }

        String providedHash = hashResetCode(cleanEmail, request.getCode().trim());
        if (!providedHash.equals(user.getPasswordResetCodeHash())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid reset code"));
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setPasswordResetCodeHash(null);
        user.setPasswordResetCodeExpiresAt(null);
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Password reset successfully. Please log in."));
    }

    public ResponseEntity<?> saveQuizResult(User user, QuizResultRequest request) {
        if (request == null || request.getScore() == null || request.getCorrectAnswers() == null
                || request.getTotalQuestions() == null || request.getMode() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "All fields required"));
        }

        int incScore = toInt(request.getScore(), 0);
        int incCorrect = toInt(request.getCorrectAnswers(), 0);
        int incTotalQuestions = toInt(request.getTotalQuestions(), 0);
        String localDate = (request.getClientLocalDate() != null && !request.getClientLocalDate().trim().isEmpty())
                ? request.getClientLocalDate().trim()
                : LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE);

        // 1. Save detailed QuizResult
        QuizResult result = new QuizResult();
        result.setUser(user.getId());
        result.setSubject(request.getSubject() != null ? request.getSubject() : "General");
        result.setTopics(request.getTopics() != null ? request.getTopics() : Collections.emptyList());
        result.setScore(incScore);
        result.setTotalQuestions(incTotalQuestions);
        result.setCorrectAnswers(incCorrect);
        result.setMode(request.getMode());
        result.setQuestions(request.getQuestions() != null ? request.getQuestions() : Collections.emptyList());
        result.setClassLevel(request.getClassLevel() != null ? request.getClassLevel() : "10");
        result.setDate(Instant.now());

        result = quizResultRepository.save(result);

        // 2. Update User Stats
        int prevTotalScore = user.getTotalScore();
        int prevAccuracy = user.getAccuracy();
        int nextTotalScore = prevTotalScore + incScore;
        int nextTotalQuizzes = user.getTotalQuizzes() + 1;
        int nextCorrectAnswers = user.getCorrectAnswers() + incCorrect;
        int nextTotalQuestions = user.getTotalQuestions() + incTotalQuestions;
        int nextAccuracy = nextTotalQuestions > 0 ? (int) Math.round(((double) nextCorrectAnswers / nextTotalQuestions) * 100.0) : 0;

        // Streak calculation
        LocalDate lastDate = parseLocalDate(user.getLastQuizLocalDate());
        LocalDate todayDate = parseLocalDate(localDate);

        int nextStreak = user.getCurrentStreak();
        if (lastDate == null) {
            nextStreak = 1;
        } else if (todayDate != null) {
            long diffDays = ChronoUnit.DAYS.between(lastDate, todayDate);
            if (diffDays == 0) {
                nextStreak = Math.max(user.getCurrentStreak(), 1);
            } else if (diffDays == 1) {
                nextStreak = user.getCurrentStreak() + 1;
            } else {
                nextStreak = 1;
            }
        } else {
            nextStreak = 1;
        }

        user.setPrevTotalScore(prevTotalScore);
        user.setPrevAccuracy(prevAccuracy);
        user.setTotalScore(nextTotalScore);
        user.setTotalQuizzes(nextTotalQuizzes);
        user.setCorrectAnswers(nextCorrectAnswers);
        user.setTotalQuestions(nextTotalQuestions);
        user.setAccuracy(nextAccuracy);
        user.setCurrentStreak(nextStreak);
        user.setLastQuizLocalDate(localDate);
        user.setLastQuizDate(Instant.now());

        if ("daily".equalsIgnoreCase(request.getMode())) {
            user.setLastDailyQuizDate(localDate);
            Map<String, Object> dailyRes = new HashMap<>();
            dailyRes.put("date", localDate);
            dailyRes.put("score", incScore);
            dailyRes.put("accuracy", incTotalQuestions > 0 ? (int) Math.round(((double) incCorrect / incTotalQuestions) * 100.0) : 0);
            dailyRes.put("completedAt", Instant.now().toString());
            user.setLastDailyQuizResult(dailyRes);
        }

        user.setUpdatedAt(Instant.now());
        user = userRepository.save(user);

        UserStatsDto stats = new UserStatsDto(
                nextTotalScore,
                nextTotalQuizzes,
                nextTotalQuestions,
                nextCorrectAnswers,
                nextAccuracy,
                nextStreak,
                user.getLastDailyQuizDate(),
                user.getLastDailyQuizResult()
        );

        // Socket notifications
        socketService.notifyStatsUpdate(user.getId(), stats);

        Map<String, Object> activity = new HashMap<>();
        activity.put("userName", user.getName());
        activity.put("subject", request.getSubject() != null ? request.getSubject() : "General");
        activity.put("score", incScore);
        activity.put("timestamp", Instant.now().toString());
        socketService.broadcastActivity(activity);

        return ResponseEntity.ok(Map.of(
                "message", "Quiz result saved successfully",
                "resultId", result.getId(),
                "stats", stats
        ));
    }

    public ResponseEntity<?> getQuizHistory(User user) {
        List<QuizResult> history = quizResultRepository.findByUserOrderByCreatedAtDesc(user.getId());
        return ResponseEntity.ok(history);
    }

    private LocalDate parseLocalDate(String str) {
        if (str == null || str.trim().isEmpty()) return null;
        try {
            return LocalDate.parse(str.trim(), DateTimeFormatter.ISO_LOCAL_DATE);
        } catch (Exception e) {
            return null;
        }
    }

    private static int toInt(Object obj, int defaultVal) {
        if (obj == null) return defaultVal;
        if (obj instanceof Number num) return num.intValue();
        try {
            return Integer.parseInt(String.valueOf(obj));
        } catch (Exception e) {
            return defaultVal;
        }
    }
}

