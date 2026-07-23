import { register } from "../controllers/authController.js";
import User from "../models/userModel.js";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

async function testRegisterMailbox() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for mailbox test");

    console.log("\n--- TEST 1: Registering with FAKE email on Google (fake_user_999999@gmail.com) ---");
    const reqFake = {
      body: {
        name: "FakeTestUser",
        email: "fake_user_999999@gmail.com",
        password: "Password123"
      }
    };
    let fakeRes = {};
    await register(reqFake, {
      status: (code) => ({ json: (data) => { fakeRes = { code, ...data }; } }),
      json: (data) => { fakeRes = { code: 200, ...data }; }
    });
    console.log("Fake Email Registration Result:", fakeRes);

    console.log("\n--- TEST 2: Registering with REAL email (manrajtoor22@gmail.com) ---");
    await User.deleteOne({ email: "manrajtoor22@gmail.com" });
    const reqReal = {
      body: {
        name: "ManrajToorTest",
        email: "manrajtoor22@gmail.com",
        password: "Password123"
      }
    };
    let realRes = {};
    await register(reqReal, {
      status: (code) => ({ json: (data) => { realRes = { code, ...data }; } }),
      json: (data) => { realRes = { code: 200, ...data }; }
    });
    console.log("Real Email Registration Result:", realRes);

    await User.deleteOne({ email: "manrajtoor22@gmail.com" });
    console.log("\nAll tests completed!");
    process.exit(0);

  } catch (err) {
    console.error("Test error:", err);
    process.exit(1);
  }
}

testRegisterMailbox();
