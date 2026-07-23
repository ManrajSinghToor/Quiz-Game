import { generateQuestions } from "../services/quizService.js";

async function testSubjectRelevance() {
  const subjects = ["Biology", "Physics", "Python Programming", "Operating System"];
  
  for (const s of subjects) {
    console.log(`\n================ Testing Subject: ${s} ================`);
    const questions = await generateQuestions(s, "10", 5, []);
    questions.forEach((q, idx) => {
      console.log(`Q${idx + 1}: ${q.question}`);
      console.log(`   Options: ${q.options.join(" | ")} (Correct: ${q.options[q.correctAnswer]})`);
    });
  }
}

testSubjectRelevance();
