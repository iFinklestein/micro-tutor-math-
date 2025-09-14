import { Skill } from "@/api/entities";
import { Question } from "@/api/entities";
import { Attempt } from "@/api/entities";
import { ReviewItem } from "@/api/entities";
import { Achievement } from "@/api/entities";

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const shuffle = (arr) => arr.sort(() => Math.random() - 0.5);

export class DataSeeder {
  static async seedSkills() {
    const existing = await Skill.list();
    if (existing.length > 0) return;

    const skillsToCreate = [
      // K-2
      { name: "Addition (0-10)", gradeBand: "K-2", category: "Arithmetic", description: "Adding two numbers with a sum up to 10.", sortOrder: 1 },
      { name: "Subtraction (0-10)", gradeBand: "K-2", category: "Arithmetic", description: "Subtracting two numbers where both are 10 or less.", sortOrder: 2 },
      { name: "Number Bonds to 10", gradeBand: "K-2", category: "Number Sense", description: "Finding the missing number to make 10.", sortOrder: 3 },
      { name: "Place Value (Tens/Ones)", gradeBand: "K-2", category: "Number Sense", description: "Understanding tens and ones in two-digit numbers.", sortOrder: 4 },
      
      // 3-5
      { name: "Addition (0-1000)", gradeBand: "3-5", category: "Arithmetic", description: "Adding multi-digit numbers.", sortOrder: 1 },
      { name: "Subtraction (0-1000)", gradeBand: "3-5", category: "Arithmetic", description: "Subtracting multi-digit numbers.", sortOrder: 2 },
      { name: "Multiplication Facts (0-12)", gradeBand: "3-5", category: "Arithmetic", description: "Mastering multiplication tables up to 12.", sortOrder: 3 },
      { name: "Division Facts (0-12)", gradeBand: "3-5", category: "Arithmetic", description: "Mastering division facts up to 12.", sortOrder: 4 },
      { name: "Basic Fractions", gradeBand: "3-5", category: "Fractions", description: "Identifying and comparing simple fractions.", sortOrder: 5 },
      
      // 6-8
      { name: "Multi-digit Multiplication", gradeBand: "6-8", category: "Arithmetic", description: "Multiplying numbers with two or more digits.", sortOrder: 1 },
      { name: "Long Division", gradeBand: "6-8", category: "Arithmetic", description: "Dividing large numbers, including remainders.", sortOrder: 2 },
      { name: "Adding/Subtracting Fractions", gradeBand: "6-8", category: "Fractions", description: "Adding and subtracting fractions with like and unlike denominators.", sortOrder: 3 },
      { name: "Percents of Numbers", gradeBand: "6-8", category: "Ratios & Percents", description: "Finding percentages of numbers (e.g., 10%, 25%, 50%).", sortOrder: 4 },
      { name: "Order of Operations", gradeBand: "6-8", category: "Algebraic Thinking", description: "Using PEMDAS to solve expressions.", sortOrder: 5 },
    ];
    
    await Skill.bulkCreate(skillsToCreate);
    console.log("Seeded skills successfully.");
  }

  static async seedQuestions() {
    const existing = await Question.list();
    if (existing.length > 0) return;

    const skills = await Skill.list();
    if (skills.length === 0) {
      console.error("Cannot seed questions, skills not found.");
      return;
    }

    let questions = [];
    const skillMap = skills.reduce((map, s) => ({...map, [s.name]: s.id}), {});

    // K-2 Generators
    for (let i = 0; i < 20; i++) {
        // Addition (0-10)
        const a1 = randInt(1, 9), b1 = randInt(1, 10 - a1);
        questions.push({ skillId: skillMap["Addition (0-10)"], level: 'easy', prompt: `${a1} + ${b1} = ?`, correctAnswer: String(a1 + b1), format: 'numeric', explain: `Start with ${a1} and count up ${b1} more.` });
        
        // Subtraction (0-10)
        const a2 = randInt(2, 10), b2 = randInt(1, a2 - 1);
        questions.push({ skillId: skillMap["Subtraction (0-10)"], level: 'easy', prompt: `${a2} - ${b2} = ?`, correctAnswer: String(a2 - b2), format: 'numeric', explain: `Start with ${a2} and count down ${b2}.` });
        
        // Number Bonds to 10
        const a3 = randInt(1, 9);
        questions.push({ skillId: skillMap["Number Bonds to 10"], level: 'easy', prompt: `${a3} + ? = 10`, correctAnswer: String(10 - a3), format: 'numeric', explain: `How many more do you need to get from ${a3} to 10?` });

        // Place Value
        const num = randInt(11, 99), place = randInt(0,1) ? 'tens' : 'ones';
        const digit = place === 'tens' ? Math.floor(num/10) : num % 10;
        questions.push({ skillId: skillMap["Place Value (Tens/Ones)"], level: 'medium', prompt: `What digit is in the ${place} place of ${num}?`, correctAnswer: String(digit), format: 'numeric', explain: `In ${num}, the ${place} digit is ${digit}.` });
    }

    // 3-5 Generators
    for (let i = 0; i < 40; i++) {
        // Multiplication Facts (0-12)
        const m1 = randInt(2, 12), m2 = randInt(2, 12);
        questions.push({ skillId: skillMap["Multiplication Facts (0-12)"], level: 'medium', prompt: `${m1} × ${m2} = ?`, correctAnswer: String(m1 * m2), format: 'numeric', explain: `This is ${m1} groups of ${m2}.` });

        // Division Facts (0-12)
        const d1 = randInt(2, 12), d2 = randInt(2, 12), d_prod = d1 * d2;
        questions.push({ skillId: skillMap["Division Facts (0-12)"], level: 'medium', prompt: `${d_prod} ÷ ${d1} = ?`, correctAnswer: String(d2), format: 'numeric', explain: `Think: what number times ${d1} equals ${d_prod}?` });
    
        // Basic Fractions
        const den = [2,3,4,5,6,8][randInt(0,5)];
        const num1 = randInt(1, den-1);
        const choices = shuffle([`${num1}/${den}`, `${randInt(1, den-1)}/${den}`, `${randInt(1, den-1)}/${den+1}`, `1/${den+randInt(0,2)}`]).slice(0,4);
        questions.push({ skillId: skillMap["Basic Fractions"], level: 'easy', prompt: `Which fraction represents the shaded part?`, correctAnswer: `${num1}/${den}`, format: 'mc', choices: choices, explain: `There are ${den} total parts, and ${num1} are shaded.`});
    }

    // 6-8 Generators
    for (let i = 0; i < 40; i++) {
        // Multi-digit Multiplication
        const md1 = randInt(10, 99), md2 = randInt(10, 50);
        questions.push({ skillId: skillMap["Multi-digit Multiplication"], level: 'hard', prompt: `${md1} × ${md2} = ?`, correctAnswer: String(md1 * md2), format: 'numeric', explain: `Use the standard algorithm or break it into parts: (${md1} × ${Math.floor(md2/10)*10}) + (${md1} × ${md2%10}).` });

        // Percents of Numbers
        const perc = [10, 25, 50][randInt(0,2)];
        const baseNum = randInt(2, 20) * (perc === 25 ? 4 : (perc === 50 ? 2: 10));
        const p_ans = baseNum * (perc/100);
        questions.push({ skillId: skillMap["Percents of Numbers"], level: 'medium', prompt: `What is ${perc}% of ${baseNum}?`, correctAnswer: String(p_ans), format: 'numeric', explain: `${perc}% is the same as the fraction ${perc}/100.` });

        // Order of Operations
        const o1 = randInt(2,10), o2=randInt(2,5), o3=randInt(2,10), o4=randInt(2,5);
        questions.push({ skillId: skillMap["Order of Operations"], level: 'hard', prompt: `${o1} + ${o2} × ${o3} = ?`, correctAnswer: String(o1 + o2 * o3), format: 'numeric', explain: `Remember PEMDAS: Multiply ${o2} × ${o3} first, then add ${o1}.` });
    }

    await Question.bulkCreate(questions);
    console.log(`Seeded ${questions.length} questions successfully.`);
  }

  static async seedDemoData() {
    const attemptsToDelete = await Attempt.list();
    if(attemptsToDelete.length > 0) await Attempt.bulkDelete(attemptsToDelete.map(a => a.id));

    const reviewsToDelete = await ReviewItem.list();
    if(reviewsToDelete.length > 0) await ReviewItem.bulkDelete(reviewsToDelete.map(r => r.id));

    const achievementsToDelete = await Achievement.list();
    if(achievementsToDelete.length > 0) await Achievement.bulkDelete(achievementsToDelete.map(a => a.id));

    const questions = await Question.list();
    if (questions.length === 0) {
        console.error("Cannot seed demo data, no questions found.");
        return;
    }

    let demoAttempts = [];
    let demoReviews = [];
    const usedForReview = new Set();
    
    // Note: The platform does not allow setting a past `created_date`,
    // so all demo data will appear with today's date. This is a limitation.
    for (let i = 0; i < 140; i++) { // 14 days * ~10 attempts
        const q = questions[randInt(0, questions.length - 1)];
        const isCorrect = Math.random() > 0.2; // 80% accuracy
        
        demoAttempts.push({
            questionId: q.id,
            skillId: q.skillId,
            levelAtAttempt: q.level,
            answer: isCorrect ? q.correctAnswer : String(Number(q.correctAnswer) + randInt(-2, 2) || 1),
            correct: isCorrect,
            timeMs: randInt(2000, 15000),
            sessionId: `demo-session-${randInt(1,5)}`,
        });

        if (!isCorrect && !usedForReview.has(q.id)) {
            demoReviews.push({
                questionId: q.id,
                skillId: q.skillId,
                nextDueDate: new Date().toISOString(),
                interval: 1,
                correctStreak: 0,
                mastered: false
            });
            usedForReview.add(q.id);
        }
    }

    await Attempt.bulkCreate(demoAttempts);
    if(demoReviews.length > 0) await ReviewItem.bulkCreate(demoReviews);

    // Unlock one achievement
    await Achievement.create({
        name: 'First 100',
        description: 'Completed 100 practice questions',
        badgeIcon: 'Target',
        unlockedDate: new Date().toISOString()
    });

    console.log("Seeded demo data successfully.");
  }
}