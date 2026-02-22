import { GoogleGenAI, Type } from "@google/genai";
import { Question, Quiz, EssayGrade } from "../types";

// Initialize the client with the API key from process.env.GEMINI_API_KEY as per guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const generateQuizAI = async (topic: string, difficulty: string, count: number = 5): Promise<Partial<Quiz>> => {
  // Translated prompt to ensure Gemini outputs Vietnamese
  const prompt = `Tạo một bài trắc nghiệm có độ khó ${difficulty} về chủ đề "${topic}" với ${count} câu hỏi trắc nghiệm.
  Mỗi câu hỏi phải có 4 lựa chọn và một đáp án đúng. Bao gồm giải thích ngắn gọn cho đáp án đúng.
  Ngôn ngữ: Tiếng Việt.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING }, // Just to match structure, usually 'multiple-choice'
                  text: { type: Type.STRING },
                  options: { 
                    type: Type.ARRAY, 
                    items: { type: Type.STRING }
                  },
                  correctAnswerIndex: { type: Type.INTEGER },
                  explanation: { type: Type.STRING }
                },
                required: ["text", "options", "correctAnswerIndex"]
              }
            }
          },
          required: ["title", "questions"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Không nhận được phản hồi từ Gemini");
    
    const data = JSON.parse(text);
    
    // Map to our internal structure with IDs
    const questions: Question[] = data.questions.map((q: any, index: number) => ({
      id: `q-${Date.now()}-${index}`,
      type: 'multiple-choice',
      text: q.text,
      options: q.options,
      correctAnswerIndex: q.correctAnswerIndex,
      explanation: q.explanation
    }));

    return {
      title: data.title,
      description: data.description || `Bài trắc nghiệm được tạo về chủ đề ${topic}`,
      questions
    };

  } catch (error) {
    console.error("Lỗi khi tạo bài trắc nghiệm:", error);
    throw error;
  }
};

export const getAIExplanation = async (questionText: string, selectedOption: string, correctOption: string): Promise<string> => {
  const prompt = `
    Câu hỏi: "${questionText}"
    Câu trả lời của người dùng: "${selectedOption}"
    Đáp án đúng: "${correctOption}"
    
    Người dùng đã trả lời sai (hoặc đúng). Hãy giải thích ngắn gọn bằng Tiếng Việt tại sao đáp án đúng lại chính xác và tại sao câu trả lời của người dùng có thể chưa đúng (nếu sai). Giữ giọng văn khuyến khích và mang tính giáo dục. Tối đa 2 câu.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || "Không có giải thích.";
  } catch (error) {
    console.error("Lỗi khi lấy giải thích:", error);
    return "Không thể lấy giải thích từ AI lúc này.";
  }
};

export const gradeEssayAI = async (questionText: string, userAnswer: string, sampleAnswer?: string): Promise<EssayGrade> => {
  const prompt = `
    Bạn là giáo viên đang chấm điểm câu trả lời của học sinh.
    Câu hỏi: "${questionText}"
    Câu trả lời của học sinh: "${userAnswer}"
    ${sampleAnswer ? `Câu trả lời tham khảo: "${sampleAnswer}"` : ''}

    Hãy chấm điểm câu trả lời của học sinh từ 0 đến 100 dựa trên độ chính xác và đầy đủ.
    Cung cấp nhận xét ngắn gọn, mang tính xây dựng bằng Tiếng Việt (tối đa 2 câu).
    
    Trả về JSON: { "score": number, "feedback": string }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                score: { type: Type.INTEGER },
                feedback: { type: Type.STRING }
            },
            required: ["score", "feedback"]
        }
      }
    });
    
    if (!response.text) throw new Error("Không có phản hồi chấm điểm");
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Lỗi khi chấm điểm tự luận:", error);
    return { score: 0, feedback: "Lỗi khi chấm bài. Vui lòng thử lại." };
  }
};