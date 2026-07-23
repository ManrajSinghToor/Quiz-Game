import { isDbConnected } from "../config/db.js";

export default function requireDb(req, res, next) {
  if (isDbConnected()) return next();
  return res.status(503).json({
    message:
      "Database is not connected. Start MongoDB locally (mongodb://127.0.0.1:27017/quizdb) or fix MONGO_URI, then retry.",
  });
}

