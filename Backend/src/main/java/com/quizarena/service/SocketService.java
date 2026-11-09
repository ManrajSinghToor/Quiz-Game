package com.quizarena.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.quizarena.dto.QuestionDto;
import io.socket.socketio.server.SocketIoNamespace;
import io.socket.socketio.server.SocketIoServer;
import io.socket.socketio.server.SocketIoSocket;
import jakarta.annotation.PostConstruct;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class SocketService {

    private final SocketIoServer socketIoServer;
    private final QuizService quizService;
    private final ObjectMapper objectMapper;

    private SocketIoNamespace namespace;

    private final Set<String> onlineUsers = ConcurrentHashMap.newKeySet();
    private final Map<String, SocketIoSocket> connectedSockets = new ConcurrentHashMap<>();

    private static class QueueUser {
        final String socketId;
        final String name;
        final int level;
        final int avatar;

        QueueUser(String socketId, String name, int level, int avatar) {
            this.socketId = socketId;
            this.name = name;
            this.level = level;
            this.avatar = avatar;
        }
    }

    private final List<QueueUser> matchmakingQueue = new CopyOnWriteArrayList<>();

    private static class PlayerMatchState {
        String name;
        int score = 0;
        boolean finished = false;
        long timeTaken = 0;

        PlayerMatchState(String name) {
            this.name = name;
        }

        Map<String, Object> toMap() {
            Map<String, Object> map = new HashMap<>();
            map.put("name", name);
            map.put("score", score);
            map.put("finished", finished);
            map.put("timeTaken", timeTaken);
            return map;
        }
    }

    private static class ActiveMatch {
        String subject;
        List<QuestionDto> questions;
        Map<String, PlayerMatchState> players = new ConcurrentHashMap<>();

        ActiveMatch(String subject, List<QuestionDto> questions) {
            this.subject = subject;
            this.questions = questions;
        }
    }

    private final Map<String, ActiveMatch> activeMatches = new ConcurrentHashMap<>();

    private static final String[] SUBJECTS = {
            "Operating System",
            "Linux",
            "Computer Networks",
            "Data Base Management System",
            "Data Structures and Algorithms",
            "C and Pointers",
            "Web Development",
            "Python Programming",
            "Cyber Security & Cryptography",
            "Cloud & DevOps",
            "Physics",
            "Chemistry",
            "Biology",
            "Mathematics",
            "Logical Reasoning",
            "Quantitative Aptitude"
    };

    public SocketService(SocketIoServer socketIoServer, QuizService quizService) {
        this.socketIoServer = socketIoServer;
        this.quizService = quizService;
        this.objectMapper = new ObjectMapper();
    }

    @PostConstruct
    public void init() {
        this.namespace = socketIoServer.namespace("/");

        this.namespace.on("connection", args -> {
            SocketIoSocket socket = (SocketIoSocket) args[0];
            String socketId = socket.getId();
            System.out.println("A user connected: " + socketId);

            onlineUsers.add(socketId);
            connectedSockets.put(socketId, socket);
            broadcastOnlineCount();

            // auth:join
            socket.on("auth:join", joinArgs -> {
                if (joinArgs != null && joinArgs.length > 0 && joinArgs[0] != null) {
                    String userId = String.valueOf(joinArgs[0]);
                    socket.joinRoom(userId);
                    System.out.println("User " + userId + " joined their private room");
                }
            });

            // matchmaking:join
            socket.on("matchmaking:join", mmArgs -> {
                try {
                    Map<String, Object> userData = parseJsonArg(mmArgs);
                    handleMatchmakingJoin(socket, userData);
                } catch (Exception e) {
                    System.err.println("Matchmaking join error: " + e.getMessage());
                }
            });

            // matchmaking:cancel
            socket.on("matchmaking:cancel", cancelArgs -> {
                matchmakingQueue.removeIf(u -> u.socketId.equals(socketId));
            });

            // quiz:submit_answer
            socket.on("quiz:submit_answer", answerArgs -> {
                try {
                    Map<String, Object> data = parseJsonArg(answerArgs);
                    handleAnswerSubmit(socket, data);
                } catch (Exception e) {
                    System.err.println("Submit answer error: " + e.getMessage());
                }
            });

            // quiz:finish
            socket.on("quiz:finish", finishArgs -> {
                try {
                    Map<String, Object> data = parseJsonArg(finishArgs);
                    handleQuizFinish(socket, data);
                } catch (Exception e) {
                    System.err.println("Quiz finish error: " + e.getMessage());
                }
            });

            // disconnect
            socket.on("disconnect", discArgs -> {
                System.out.println("User disconnected: " + socketId);
                onlineUsers.remove(socketId);
                connectedSockets.remove(socketId);
                matchmakingQueue.removeIf(u -> u.socketId.equals(socketId));

                // Cleanup active matches if a player disconnects
                for (Map.Entry<String, ActiveMatch> entry : activeMatches.entrySet()) {
                    String roomId = entry.getKey();
                    ActiveMatch match = entry.getValue();
                    if (match.players.containsKey(socketId)) {
                        for (String opponentId : match.players.keySet()) {
                            if (!opponentId.equals(socketId)) {
                                SocketIoSocket opponentSocket = connectedSockets.get(opponentId);
                                if (opponentSocket != null) {
                                    opponentSocket.send("match:opponent_disconnected");
                                }
                            }
                        }
                        activeMatches.remove(roomId);
                    }
                }

                broadcastOnlineCount();
            });
        });
    }

    private synchronized void handleMatchmakingJoin(SocketIoSocket socket, Map<String, Object> userData) {
        String socketId = socket.getId();
        boolean alreadyInQueue = matchmakingQueue.stream().anyMatch(u -> u.socketId.equals(socketId));
        if (alreadyInQueue) return;

        String name = userData.containsKey("name") ? String.valueOf(userData.get("name")) : "Guest";
        int level = userData.containsKey("level") ? toInt(userData.get("level"), 1) : 1;
        int avatar = userData.containsKey("avatar") ? toInt(userData.get("avatar"), 0) : 0;

        QueueUser newUser = new QueueUser(socketId, name, level, avatar);

        if (!matchmakingQueue.isEmpty()) {
            QueueUser opponent = matchmakingQueue.remove(0);
            SocketIoSocket opponentSocket = connectedSockets.get(opponent.socketId);

            if (opponentSocket == null) {
                matchmakingQueue.add(newUser);
                return;
            }

            String roomId = "room_" + opponent.socketId + "_" + newUser.socketId;
            Random rand = new Random();
            String subject = SUBJECTS[rand.nextInt(SUBJECTS.length)];

            System.out.println("Starting match: " + newUser.name + " vs " + opponent.name + " on " + subject);

            try {
                List<QuestionDto> questions = quizService.generateQuestions(subject, "10", 10, Collections.emptyList());

                ActiveMatch match = new ActiveMatch(subject, questions);
                match.players.put(newUser.socketId, new PlayerMatchState(newUser.name));
                match.players.put(opponent.socketId, new PlayerMatchState(opponent.name));
                activeMatches.put(roomId, match);

                socket.joinRoom(roomId);
                opponentSocket.joinRoom(roomId);

                // Construct match data
                Map<String, Object> baseMatchData = new HashMap<>();
                baseMatchData.put("roomId", roomId);
                baseMatchData.put("subject", subject);
                baseMatchData.put("timePerQuestion", 20);

                // Questions to JSONArray
                String questionsJson = objectMapper.writeValueAsString(questions);
                baseMatchData.put("questions", new JSONArray(questionsJson));

                // Send to newUser
                Map<String, Object> toNewUser = new HashMap<>(baseMatchData);
                Map<String, Object> opForNewUser = new HashMap<>();
                opForNewUser.put("name", opponent.name);
                opForNewUser.put("level", opponent.level);
                opForNewUser.put("avatar", opponent.avatar);
                toNewUser.put("opponent", new JSONObject(opForNewUser));
                socket.send("matchmaking:found", new JSONObject(toNewUser));

                // Send to opponent
                Map<String, Object> toOpponent = new HashMap<>(baseMatchData);
                Map<String, Object> opForOpponent = new HashMap<>();
                opForOpponent.put("name", newUser.name);
                opForOpponent.put("level", newUser.level);
                opForOpponent.put("avatar", newUser.avatar);
                toOpponent.put("opponent", new JSONObject(opForOpponent));
                opponentSocket.send("matchmaking:found", new JSONObject(toOpponent));

            } catch (Exception e) {
                System.err.println("Match initialization failed: " + e.getMessage());
                socket.send("matchmaking:error", "Failed to initialize match");
                opponentSocket.send("matchmaking:error", "Failed to initialize match");
            }
        } else {
            matchmakingQueue.add(newUser);
        }
    }

    private void handleAnswerSubmit(SocketIoSocket socket, Map<String, Object> data) {
        String roomId = String.valueOf(data.get("roomId"));
        ActiveMatch match = activeMatches.get(roomId);
        if (match == null || !match.players.containsKey(socket.getId())) return;

        int score = toInt(data.get("score"), 0);
        long timeTaken = toLong(data.get("timeTaken"), 0);

        PlayerMatchState pState = match.players.get(socket.getId());
        pState.score = score;
        pState.timeTaken += timeTaken;

        // Broadcast progress to opponent
        for (String opponentId : match.players.keySet()) {
            if (!opponentId.equals(socket.getId())) {
                SocketIoSocket opponentSocket = connectedSockets.get(opponentId);
                if (opponentSocket != null) {
                    JSONObject progressObj = new JSONObject();
                    progressObj.put("score", pState.score);
                    progressObj.put("questionIndex", 0);
                    opponentSocket.send("match:opponent_progress", progressObj);
                }
            }
        }
    }

    private void handleQuizFinish(SocketIoSocket socket, Map<String, Object> data) {
        String roomId = String.valueOf(data.get("roomId"));
        ActiveMatch match = activeMatches.get(roomId);
        if (match == null || !match.players.containsKey(socket.getId())) return;

        int score = toInt(data.get("score"), 0);
        long timeTaken = toLong(data.get("timeTaken"), 0);

        PlayerMatchState pState = match.players.get(socket.getId());
        pState.score = score;
        pState.timeTaken += timeTaken;
        pState.finished = true;

        boolean allFinished = match.players.values().stream().allMatch(p -> p.finished);

        if (allFinished) {
            List<String> playerIds = new ArrayList<>(match.players.keySet());
            if (playerIds.size() >= 2) {
                String p1Id = playerIds.get(0);
                String p2Id = playerIds.get(1);
                PlayerMatchState p1 = match.players.get(p1Id);
                PlayerMatchState p2 = match.players.get(p2Id);

                String winnerId = null;
                if (p1.score > p2.score) {
                    winnerId = p1Id;
                } else if (p2.score > p1.score) {
                    winnerId = p2Id;
                } else if (p1.timeTaken < p2.timeTaken) {
                    winnerId = p1Id;
                } else if (p2.timeTaken < p1.timeTaken) {
                    winnerId = p2Id;
                }

                JSONObject resultObj = new JSONObject();
                if (winnerId != null) {
                    resultObj.put("winnerId", winnerId);
                } else {
                    resultObj.put("winnerId", JSONObject.NULL);
                }

                JSONObject playersObj = new JSONObject();
                for (Map.Entry<String, PlayerMatchState> entry : match.players.entrySet()) {
                    playersObj.put(entry.getKey(), new JSONObject(entry.getValue().toMap()));
                }
                resultObj.put("players", playersObj);

                namespace.broadcast(roomId, "match:result", resultObj);
                activeMatches.remove(roomId);
            }
        }
    }

    public void notifyStatsUpdate(String userId, Object stats) {
        try {
            if (namespace != null) {
                if (userId != null) {
                    String json = objectMapper.writeValueAsString(stats);
                    namespace.broadcast(userId, "stats:updated", new JSONObject(json));
                }
                namespace.broadcast(null, "leaderboard:updated");
            }
        } catch (Exception e) {
            System.err.println("notifyStatsUpdate error: " + e.getMessage());
        }
    }

    public void broadcastActivity(Object activity) {
        try {
            if (namespace != null) {
                String json = objectMapper.writeValueAsString(activity);
                namespace.broadcast(null, "activity:new", new JSONObject(json));
                namespace.broadcast(null, "leaderboard:updated");
            }
        } catch (Exception e) {
            System.err.println("broadcastActivity error: " + e.getMessage());
        }
    }

    private void broadcastOnlineCount() {
        if (namespace != null) {
            namespace.broadcast(null, "onlineUsersCount", onlineUsers.size());
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> parseJsonArg(Object[] args) {
        if (args == null || args.length == 0 || args[0] == null) {
            return Collections.emptyMap();
        }
        Object arg = args[0];
        if (arg instanceof JSONObject jsonObject) {
            return jsonObject.toMap();
        }
        if (arg instanceof Map<?, ?> map) {
            return (Map<String, Object>) map;
        }
        if (arg instanceof String str) {
            try {
                return objectMapper.readValue(str, Map.class);
            } catch (Exception e) {
                return Collections.emptyMap();
            }
        }
        return Collections.emptyMap();
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

    private static long toLong(Object obj, long defaultVal) {
        if (obj == null) return defaultVal;
        if (obj instanceof Number num) return num.longValue();
        try {
            return Long.parseLong(String.valueOf(obj));
        } catch (Exception e) {
            return defaultVal;
        }
    }
}

