import { generateQuestions } from "../services/quizService.js";

async function test() {
    console.log("Testing Question Generation...");
    const subjects = ["Physics", "Maths"];
    
    for (const subject of subjects) {
        console.log(`\n--- Subject: ${subject} ---`);
        try {
            const questions = await generateQuestions(subject, "10", 3);
            console.log(`Fetched ${questions.length} questions.`);
            console.log("First question:", JSON.stringify(questions[0], null, 2));
        } catch (error) {
            console.error(`Error for ${subject}:`, error.message);
        }
    }
}

test();
