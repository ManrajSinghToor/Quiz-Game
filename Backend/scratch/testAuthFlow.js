import { register, login } from "../controllers/authController.js";
import User from "../models/userModel.js";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

async function testAuth() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for auth test");

    const testEmail = "testuser_quizarena_99@gmail.com";
    const testPassword = "Password123";
    const testName = "TestPlayer99";

    // Cleanup previous test user if exists
    await User.deleteOne({ email: testEmail });

    console.log(`\n1. Testing Registration for ${testEmail}...`);
    const reqReg = { body: { name: testName, email: testEmail, password: testPassword } };
    let resRegData = {};
    const resReg = {
      status: (code) => ({
        json: (data) => { resRegData = { code, ...data }; }
      }),
      json: (data) => { resRegData = { code: 200, ...data }; }
    };

    await register(reqReg, resReg);
    console.log("Registration Response:", resRegData);

    console.log(`\n2. Testing Login by Email (${testEmail})...`);
    const reqLogin = { body: { email: testEmail, password: testPassword } };
    let resLoginData = {};
    const resLogin = {
      status: (code) => ({
        json: (data) => { resLoginData = { code, ...data }; }
      }),
      json: (data) => { resLoginData = { code: 200, ...data }; }
    };

    await login(reqLogin, resLogin);
    console.log("Login by Email Response:", resLoginData);

    console.log(`\n3. Testing Login by Username (${testName})...`);
    const reqLoginUser = { body: { email: testName, password: testPassword } };
    let resLoginUserData = {};
    const resLoginUser = {
      status: (code) => ({
        json: (data) => { resLoginUserData = { code, ...data }; }
      }),
      json: (data) => { resLoginUserData = { code: 200, ...data }; }
    };

    await login(reqLoginUser, resLoginUser);
    console.log("Login by Username Response:", resLoginUserData);

    // Cleanup test user
    await User.deleteOne({ email: testEmail });
    console.log("\nCleanup done!");
    process.exit(0);

  } catch (err) {
    console.error("Auth test error:", err);
    process.exit(1);
  }
}

testAuth();
