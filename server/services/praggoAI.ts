import { GoogleGenerativeAI } from "@google/generative-ai";

// 5-key rotation system for high availability
const GEMINI_API_KEYS = [
  process.env.GEMINI_KEY_1 || "AIzaSyABdNCR_6wfhSOUJoGPWpSqUTWOGtbbBiQ",
  process.env.GEMINI_KEY_2 || "",
  process.env.GEMINI_KEY_3 || "",
  process.env.GEMINI_KEY_4 || "",
  process.env.GEMINI_KEY_5 || ""
].filter(key => key.length > 0); // Only use non-empty keys

let currentKeyIndex = 0;
const keyFailures = new Map<number, number>(); // Track failures per key

function getNextApiKey(): { key: string; index: number } {
  const startIndex = currentKeyIndex;
  
  // Try each key, skipping recently failed ones
  do {
    const failures = keyFailures.get(currentKeyIndex) || 0;
    
    // If this key hasn't failed recently (< 3 times), use it
    if (failures < 3) {
      const key = GEMINI_API_KEYS[currentKeyIndex];
      const index = currentKeyIndex;
      currentKeyIndex = (currentKeyIndex + 1) % GEMINI_API_KEYS.length;
      return { key, index };
    }
    
    // Move to next key
    currentKeyIndex = (currentKeyIndex + 1) % GEMINI_API_KEYS.length;
  } while (currentKeyIndex !== startIndex);
  
  // All keys have failed, reset failures and try again
  keyFailures.clear();
  const key = GEMINI_API_KEYS[currentKeyIndex];
  const index = currentKeyIndex;
  currentKeyIndex = (currentKeyIndex + 1) % GEMINI_API_KEYS.length;
  return { key, index };
}

function markKeyFailure(keyIndex: number) {
  const failures = keyFailures.get(keyIndex) || 0;
  keyFailures.set(keyIndex, failures + 1);
}

function markKeySuccess(keyIndex: number) {
  keyFailures.delete(keyIndex);
}

interface QuestionGenerationParams {
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  chapterId?: string;
  chapterTitle?: string;
  questionType: 'mcq' | 'cq' | 'creative';
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  category: 'math' | 'theory' | 'mixed';
  quantity: number;
}

interface GeneratedQuestion {
  questionText: string;
  questionType: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  solution: string;
}

export async function generateQuestions(params: QuestionGenerationParams): Promise<GeneratedQuestion[]> {
  const { key, index } = getNextApiKey();
  
  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const prompt = buildQuestionPrompt(params);
    
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    // Parse the response to extract questions
    const questions = parseQuestions(text, params.questionType);
    
    markKeySuccess(index);
    return questions;
  } catch (error: any) {
    console.error(`Gemini API error with key ${index + 1}:`, error.message);
    markKeyFailure(index);
    
    // If quota exceeded or rate limit, try next key
    if (error.message?.includes('quota') || error.message?.includes('rate')) {
      if (GEMINI_API_KEYS.length > 1) {
        console.log('Retrying with next API key...');
        return generateQuestions(params); // Retry with next key
      }
    }
    
    throw new Error('সকল API কী ব্যর্থ হয়েছে। অনুগ্রহ করে পরে আবার চেষ্টা করুন।');
  }
}

interface AISolveParams {
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  chapterTitle?: string;
  prompt: string;
  conversationHistory?: Array<{ role: string; content: string }>;
}

export async function* solveWithAI(params: AISolveParams): AsyncGenerator<string> {
  const { key, index } = getNextApiKey();
  
  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const systemPrompt = buildSolverPrompt(params);
    
    // Build conversation history
    const history = params.conversationHistory || [];
    const messages = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: 'আমি প্রস্তুত। আপনার প্রশ্ন জিজ্ঞাসা করুন।' }] },
      ...history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      })),
      { role: 'user', parts: [{ text: params.prompt }] }
    ];

    const chat = model.startChat({
      history: messages.slice(0, -1),
    });

    const result = await chat.sendMessageStream(params.prompt);
    
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      yield chunkText;
    }
    
    markKeySuccess(index);
  } catch (error: any) {
    console.error(`Gemini AI solve error with key ${index + 1}:`, error.message);
    markKeyFailure(index);
    
    if (error.message?.includes('quota') || error.message?.includes('rate')) {
      if (GEMINI_API_KEYS.length > 1) {
        console.log('Retrying with next API key...');
        yield* solveWithAI(params); // Retry with next key
        return;
      }
    }
    
    throw new Error('AI সেবা বর্তমানে উপলব্ধ নেই। অনুগ্রহ করে পরে আবার চেষ্টা করুন।');
  }
}

function buildQuestionPrompt(params: QuestionGenerationParams): string {
  const {
    className,
    subjectName,
    chapterTitle,
    questionType,
    difficulty,
    category,
    quantity
  } = params;

  let prompt = `You are an expert NCTB (National Curriculum and Textbook Board of Bangladesh) question generator.

Generate ${quantity} ${questionType.toUpperCase()} questions for:
- Class: ${className}
- Subject: ${subjectName}
${chapterTitle ? `- Chapter: ${chapterTitle}` : ''}
- Question Type: ${questionType}
- Difficulty: ${difficulty}
- Category: ${category}

IMPORTANT GUIDELINES:
1. All questions MUST follow NCTB curriculum standards for Bangladesh
2. Questions should be in BANGLA (বাংলা) language
3. For MCQ questions: Provide 4 options (ক, খ, গ, ঘ) with only ONE correct answer
4. Include detailed explanations in Bangla
5. Provide step-by-step solutions for mathematical problems

${questionType === 'mcq' ? `
Format each MCQ question as follows:
প্রশ্ন: [Question text in Bangla]
ক) [Option A]
খ) [Option B]
গ) [Option C]
ঘ) [Option D]
সঠিক উত্তর: [ক/খ/গ/ঘ]
ব্যাখ্যা: [Detailed explanation]
সমাধান: [Step-by-step solution if mathematical]

---
` : questionType === 'cq' ? `
Format each CQ (Creative Question) as:
প্রশ্ন: [Question text]
উত্তর: [Detailed answer with explanation]
সমাধান: [Step-by-step solution]

---
` : `
Format each Creative Question as:
উদ্দীপক: [Stimulus/Context]
প্রশ্ন ক) [Knowledge-based question]
প্রশ্ন খ) [Comprehension question]
প্রশ্ন গ) [Application question]
প্রশ্ন ঘ) [Higher-order thinking question]

উত্তর ক) [Answer]
উত্তর খ) [Answer]
উত্তর গ) [Answer]
উত্তর ঘ) [Answer]

---
`}

Generate EXACTLY ${quantity} questions following the format above. Separate each question with "---".`;

  return prompt;
}

function buildSolverPrompt(params: AISolveParams): string {
  const { className, subjectName, chapterTitle } = params;

  return `You are Praggo AI, an expert tutor for Bangladesh's NCTB curriculum.

CONTEXT:
- Student Class: ${className}
- Subject: ${subjectName}
${chapterTitle ? `- Current Chapter: ${chapterTitle}` : ''}

YOUR ROLE:
1. Answer student questions clearly in BANGLA (বাংলা)
2. Follow NCTB curriculum standards strictly
3. Provide step-by-step explanations for mathematical problems
4. Use simple language suitable for the student's class level
5. Encourage learning with positive reinforcement

GUIDELINES:
- Be patient and supportive
- Break down complex concepts into simple steps
- Use examples from daily life when helpful
- For math problems: show each calculation step
- For science: explain concepts with real-world applications
- Always verify answers are curriculum-appropriate

Respond in a friendly, educational manner. Start your responses with encouraging words like "চমৎকার প্রশ্ন!" or "আমি সাহায্য করছি..."`;
}

function parseQuestions(text: string, questionType: string): GeneratedQuestion[] {
  const questions: GeneratedQuestion[] = [];
  const parts = text.split('---').map(p => p.trim()).filter(p => p.length > 0);

  for (const part of parts) {
    try {
      if (questionType === 'mcq') {
        const questionMatch = part.match(/প্রশ্ন[:\s]*(.*?)(?=ক\))/s);
        const optionA = part.match(/ক\)\s*(.*?)(?=খ\))/s)?.[1]?.trim();
        const optionB = part.match(/খ\)\s*(.*?)(?=গ\))/s)?.[1]?.trim();
        const optionC = part.match(/গ\)\s*(.*?)(?=ঘ\))/s)?.[1]?.trim();
        const optionD = part.match(/ঘ\)\s*(.*?)(?=সঠিক উত্তর)/s)?.[1]?.trim();
        const correctAnswer = part.match(/সঠিক উত্তর[:\s]*(.*?)(?=ব্যাখ্যা|$)/s)?.[1]?.trim();
        const explanation = part.match(/ব্যাখ্যা[:\s]*(.*?)(?=সমাধান|$)/s)?.[1]?.trim();
        const solution = part.match(/সমাধান[:\s]*(.*?)$/s)?.[1]?.trim();

        if (questionMatch && optionA && optionB && optionC && optionD && correctAnswer) {
          questions.push({
            questionText: questionMatch[1].trim(),
            questionType: 'MCQ',
            options: [optionA, optionB, optionC, optionD],
            correctAnswer: correctAnswer,
            explanation: explanation || '',
            solution: solution || ''
          });
        }
      } else {
        const questionMatch = part.match(/প্রশ্ন[:\s]*(.*?)(?=উত্তর)/s);
        const answerMatch = part.match(/উত্তর[:\s]*(.*?)(?=সমাধান|$)/s);
        const solutionMatch = part.match(/সমাধান[:\s]*(.*?)$/s);

        if (questionMatch && answerMatch) {
          questions.push({
            questionText: questionMatch[1].trim(),
            questionType: questionType.toUpperCase(),
            correctAnswer: answerMatch[1].trim(),
            explanation: answerMatch[1].trim(),
            solution: solutionMatch?.[1]?.trim() || ''
          });
        }
      }
    } catch (error) {
      console.error('Error parsing question:', error);
    }
  }

  return questions;
}
