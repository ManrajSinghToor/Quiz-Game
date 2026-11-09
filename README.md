# Quiz Arena 🏆

A full-stack, real-time multiplayer, and AI-powered quiz platform built with **Java Spring Boot 3** and **React** (Vite + Tailwind CSS).

Live Frontend Deployed: [https://quiz-game-six-blue.vercel.app/](https://quiz-game-six-blue.vercel.app/)

---

## 🛠 Tech Stack

### Backend
- **Framework:** Java 21 / Spring Boot 3.3.5
- **Security:** Spring Security 6, JWT (JJWT), BCrypt Password Hashing
- **Database:** MongoDB & Spring Data MongoDB
- **Real-Time Networking:** Native Socket.IO & Engine.IO server via `io.socket:socket.io-server` & Spring WebSocket
- **AI Question Generation:** Google Gemini Flash Models (`gemini-2.0-flash-lite`, `gemini-2.0-flash`) with curated deterministic daily fallbacks
- **Mailing & Verification:** Jakarta Mail / Spring Mail (Gmail SMTP STARTTLS & Port 465 SSL, Resend & Brevo HTTPS fallback), DNS MX record & disposable domain verification
- **Build Tool:** Maven (with `./mvnw` wrapper)

### Frontend
- **Framework:** React 18, Vite, TypeScript
- **Styling:** Tailwind CSS, Radix UI primitives, Lucide Icons, Shadcn UI
- **Real-Time Client:** `socket.io-client` v4
- **State & Data Fetching:** TanStack React Query

---

## 🚀 Key Features

1. **AI & Curated Quiz Generation:**
   - 16 diverse academic & technical categories (Operating Systems, Computer Networks, DBMS, DSA, Linux, C & Pointers, Web Dev, Python, Cyber Security, Cloud & DevOps, Physics, Chemistry, Biology, Mathematics, Logical Reasoning, Quantitative Aptitude).
   - Generates multiple-choice questions via Google Gemini API with latency fallbacks.
   - Intelligent deterministic daily-seeded fallbacks guarantee zero repetitive options.

2. **Real-Time Multiplayer Battles (Socket.IO):**
   - 1v1 matchmaking queue.
   - Synchronized question delivery and timer (20s per question).
   - Live opponent progress tracking (`match:opponent_progress`).
   - Winner determination based on score and completion time (`match:result`).
   - Disconnection handling (`match:opponent_disconnected`).

3. **User Authentication & Profiles:**
   - Email format & DNS MX verification with disposable domain filtering.
   - 6-digit OTP verification code sent via SMTP/Email.
   - Secure registration & login (supports username or email).
   - SHA-256 hashed password reset verification codes.
   - Avatar customization (12 unique avatars) and profile stats tracking.

4. **Gamification & Analytics:**
   - Global live leaderboard.
   - Streak tracking based on client local dates.
   - Daily challenges with streak rewards.
   - Comprehensive quiz history and accuracy metrics.

5. **Unified Single-Port Deployment:**
   - Spring Boot serves REST API endpoints (`/api/auth/**`), native Socket.IO events (`/socket.io/**`), and SPA static assets (`Frontend/dist`) from a single port.

---

## 📦 Project Structure

```
├── Backend/
│   ├── mvnw
│   ├── mvnw.cmd
│   ├── pom.xml
│   ├── .env
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/quizarena/
│   │   │   │   ├── QuizArenaApplication.java
│   │   │   │   ├── config/             # Spring Security, Mongo, Socket.IO, WebMvc
│   │   │   │   ├── controller/         # Auth, Socket.IO HTTP, SPA Forwarding
│   │   │   │   ├── dto/                # Request & Response payloads
│   │   │   │   ├── model/              # User, QuizResult, Otp documents
│   │   │   │   ├── repository/         # Spring Data Mongo Repositories
│   │   │   │   ├── security/           # JWT Filter & Token Provider
│   │   │   │   ├── service/            # AuthService, QuizService, EmailService, SocketService
│   │   │   │   └── socket/             # Engine.IO Spring WebSocket Handler & Wrapper
│   │   │   └── resources/
│   │   │       └── application.properties
│   │   └── test/
│   │       └── java/com/quizarena/     # Unit & Integration Tests
├── Frontend/
│   ├── src/                            # React Components, Pages, Contexts
│   ├── dist/                           # Production build assets
│   └── package.json
├── package.json                        # Root convenience scripts
└── README.md
```

---

## ⚙️ Environment Variables

Create or update `Backend/.env`:

```env
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/quizdb
JWT_SECRET=your_jwt_secret_key
GEMINI_API_KEY=your_gemini_api_key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
FRONTEND_URL=https://quiz-game-six-blue.vercel.app
BACKEND_URL=https://your-backend-domain.com
PORT=8080
```

---

## 🏃 Getting Started

### 1. Build Frontend
```bash
cd Frontend
npm install
npm run build
```

### 2. Run Backend (Spring Boot)
```bash
cd ../Backend
./mvnw spring-boot:run
```

The unified server will start on `http://localhost:8080` (or the configured `PORT`), serving both API endpoints, Socket.IO, and the frontend web app.
