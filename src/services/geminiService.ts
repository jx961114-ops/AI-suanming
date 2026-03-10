import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { BaziData, AstrologyData, BirthInfo, AnalysisMode, FortuneData, ComprehensiveAnalysis } from '../types';

function getAI() {
  // Always read from process.env to get the latest key if it changes at runtime
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || '';
  return new GoogleGenAI({ apiKey });
}

// Helper to check for quota/rate limit errors
export function isQuotaError(err: any): boolean {
  if (!err) return false;
  
  // Check stringified error
  const errStr = typeof err === 'string' ? err : JSON.stringify(err);
  if (errStr.includes('429') || errStr.includes('quota') || errStr.includes('RESOURCE_EXHAUSTED')) {
    return true;
  }
  
  // Check common error object structures
  if (err.status === 'RESOURCE_EXHAUSTED' || err.code === 429) return true;
  if (err.error?.status === 'RESOURCE_EXHAUSTED' || err.error?.code === 429) return true;
  if (err.message && (err.message.includes('429') || err.message.includes('quota') || err.message.includes('RESOURCE_EXHAUSTED'))) return true;
  
  return false;
}

// Helper for exponential backoff retries
async function callWithRetry(fn: () => Promise<any>, maxRetries = 3): Promise<any> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      if (isQuotaError(error)) {
        const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
        console.warn(`Rate limit hit, retrying in ${Math.round(delay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

function cleanMarkdown(text: string): string {
  if (!text) return '';
  
  // 1. Handle literal escaped characters
  let cleaned = text
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t');
  
  // 2. Remove markdown code block wrappers
  cleaned = cleaned.trim();
  cleaned = cleaned.replace(/^```markdown\s+/i, '');
  cleaned = cleaned.replace(/^```\s+/i, '');
  cleaned = cleaned.replace(/\s+```$/i, '');
  
  return cleaned;
}

export async function getComprehensiveAnalysis(info: BirthInfo, bazi: BaziData, astrology: AstrologyData): Promise<ComprehensiveAnalysis> {
  // Use Flash by default for better stability and speed in shared environments
  const model = "gemini-3-flash-preview";
  const today = new Date().toISOString().split('T')[0];
  const prompt = `你是一位精通东西方命理的顶级大师。请根据以下信息，为用户生成一份全方位的命理分析报告。
  
  出生信息：${info.date} ${info.time}, 性别：${info.gender}
  八字：${bazi.year.stem}${bazi.year.branch} ${bazi.month.stem}${bazi.month.branch} ${bazi.day.stem}${bazi.day.branch} ${bazi.hour.stem}${bazi.hour.branch}
  星盘摘要：${astrology.planets.map(p => `${p.name}${p.sign}`).join(', ')}
  
  请生成以下三个部分的内容：
  1. 八字深度分析（Markdown格式）：必须包含以下二级标题：## 命格综述、## 性格特质、## 事业财运、## 感情婚姻、## 健康建议。
  2. 星盘深度分析（Markdown格式）：必须包含以下二级标题：## 人格特质、## 职业天赋、## 情感模式、## 人生主题。
  3. 今日（${today}）运势数据：包含各项评分（0-100）和简短总结建议。
  
  重要排版要求：
  - 必须使用标准 Markdown 格式。
  - 段落之间必须使用两个换行符（空行）分隔。
  - 标题（##）前后必须有空行。
  - 列表项必须另起一行。
  - 严禁将所有文字挤在同一行。
  
  请严格按照JSON格式返回，结构如下：
  {
    "baziAnalysis": "Markdown字符串",
    "astrologyAnalysis": "Markdown字符串",
    "fortuneData": {
      "overallScore": 数字,
      "loveScore": 数字,
      "wealthScore": 数字,
      "careerScore": 数字,
      "studyScore": 数字,
      "interpersonalScore": 数字,
      "summary": "字符串",
      "suggestion": "字符串",
      "avoid": "字符串",
      "luckyColor": "字符串"
    }
  }`;

  return callWithRetry(async () => {
    const response = await getAI().models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            baziAnalysis: { type: Type.STRING },
            astrologyAnalysis: { type: Type.STRING },
            fortuneData: {
              type: Type.OBJECT,
              properties: {
                overallScore: { type: Type.NUMBER },
                loveScore: { type: Type.NUMBER },
                wealthScore: { type: Type.NUMBER },
                careerScore: { type: Type.NUMBER },
                studyScore: { type: Type.NUMBER },
                interpersonalScore: { type: Type.NUMBER },
                summary: { type: Type.STRING },
                suggestion: { type: Type.STRING },
                avoid: { type: Type.STRING },
                luckyColor: { type: Type.STRING },
              },
              required: ["overallScore", "loveScore", "wealthScore", "careerScore", "studyScore", "interpersonalScore", "summary", "suggestion", "avoid", "luckyColor"]
            }
          },
          required: ["baziAnalysis", "astrologyAnalysis", "fortuneData"]
        }
      }
    });

    if (!response || !response.text) {
      throw new Error("AI 未返回有效内容");
    }

    try {
      const data = JSON.parse(response.text);
      if (data.baziAnalysis) data.baziAnalysis = cleanMarkdown(data.baziAnalysis);
      if (data.astrologyAnalysis) data.astrologyAnalysis = cleanMarkdown(data.astrologyAnalysis);
      return data;
    } catch (parseError) {
      console.error("JSON Parse Error:", response.text);
      throw new Error("AI 返回的数据格式解析失败");
    }
  });
}

export async function getDailyFortune(info: BirthInfo, bazi: BaziData, astrology: AstrologyData): Promise<FortuneData> {
  const model = "gemini-3-flash-preview";
  const today = new Date().toISOString().split('T')[0];
  const prompt = `你是一位精通东西方命理的运势分析专家。请根据以下信息，为用户生成一份今日（${today}）的详细运势报告。
  出生信息：${info.date} ${info.time}, 性别：${info.gender}
  八字：${bazi.year.stem}${bazi.year.branch} ${bazi.month.stem}${bazi.month.branch} ${bazi.day.stem}${bazi.day.branch} ${bazi.hour.stem}${bazi.hour.branch}
  星盘摘要：${astrology.planets.map(p => `${p.name}${p.sign}`).join(', ')}
  
  请严格按照JSON格式返回，包含以下字段：
  overallScore (0-100), loveScore (0-100), wealthScore (0-100), careerScore (0-100), studyScore (0-100), interpersonalScore (0-100), summary (简短总结), suggestion (建议), avoid (避免), luckyColor (幸运色)。`;

  return callWithRetry(async () => {
    const response = await getAI().models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallScore: { type: Type.NUMBER },
            loveScore: { type: Type.NUMBER },
            wealthScore: { type: Type.NUMBER },
            careerScore: { type: Type.NUMBER },
            studyScore: { type: Type.NUMBER },
            interpersonalScore: { type: Type.NUMBER },
            summary: { type: Type.STRING },
            suggestion: { type: Type.STRING },
            avoid: { type: Type.STRING },
            luckyColor: { type: Type.STRING },
          },
          required: ["overallScore", "loveScore", "wealthScore", "careerScore", "studyScore", "interpersonalScore", "summary", "suggestion", "avoid", "luckyColor"]
        }
      }
    });
    return JSON.parse(response.text);
  });
}

export async function analyzeBazi(info: BirthInfo, data: BaziData) {
  const model = "gemini-3-flash-preview";
  const prompt = `你是一个玄学算命大师 研究多年 精通紫薇天象，给很多富豪看过运势，给你我的生辰和地址 你帮我算算吧：
  出生信息：${info.date} ${info.time}, 性别：${info.gender}
  八字：
  年柱：${data.year.stem}${data.year.branch} (${data.year.element})
  月柱：${data.month.stem}${data.month.branch} (${data.month.element})
  日柱：${data.day.stem}${data.day.branch} (${data.day.element})
  时柱：${data.hour.stem}${data.hour.branch} (${data.hour.element})
  五行分布：${JSON.stringify(data.fiveElements)}
  日主：${data.dayMaster}
  
  请从以下几个维度进行分析，你说出的话应该有8-9成的把握，并以Markdown格式返回：
  1. 命格综述：分析命局强弱，格局高低。
  2. 性格特质：基于日主和五行分析性格优缺点。
  3. 事业财运：适合从事的行业，一生财运走势。
  4. 感情婚姻：感情观，婚姻稳定程度。
  5. 健康建议：需要注意的身体部位。
  
  排版要求：必须使用标准 Markdown，段落之间留空行，确保易读。`;

  return callWithRetry(async () => {
    const response = await getAI().models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });
    return cleanMarkdown(response.text);
  });
}

export async function analyzeAstrology(info: BirthInfo, data: AstrologyData) {
  const model = "gemini-3-flash-preview";
  const prompt = `你是一位精通西方占星学的占星师。请根据以下星盘信息进行深度分析：
  出生信息：${info.date} ${info.time}, 性别：${info.gender}
  行星位置：
  ${data.planets.map(p => `${p.name}: ${p.sign} ${p.house}宫`).join('\n')}
  上升点：${data.ascendant}
  
  请从以下几个维度进行分析，并以Markdown格式返回：
  1. 人格特质：太阳、月亮、上升点的综合影响。
  2. 职业天赋：2宫、6宫、10宫相关分析。
  3. 情感模式：金星、火星的影响。
  4. 人生主题：星盘中的主要相位或重点宫位。
  
  排版要求：必须使用标准 Markdown，段落之间留空行，确保易读。`;

  return callWithRetry(async () => {
    const response = await getAI().models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });
    return cleanMarkdown(response.text);
  });
}

export async function chatWithAI(
  info: BirthInfo, 
  bazi: BaziData, 
  astrology: AstrologyData, 
  question: string, 
  history: { role: string, text: string }[],
  mode: AnalysisMode = 'mixed'
) {
  const model = "gemini-3-flash-preview";
  
  let modeInstruction = "";
  if (mode === 'bazi') {
    modeInstruction = "请仅使用东方八字命理知识进行回答。";
  } else if (mode === 'astrology') {
    modeInstruction = "请仅使用西方占星学知识进行回答。";
  } else {
    modeInstruction = "请结合东西方命理知识，进行综合分析。";
  }

  const systemInstruction = `你是一位全能的命理顾问。
  ${modeInstruction}
  用户的出生信息：${info.date} ${info.time}, 性别：${info.gender}
  八字：${bazi.year.stem}${bazi.year.branch} ${bazi.month.stem}${bazi.month.branch} ${bazi.day.stem}${bazi.day.branch} ${bazi.hour.stem}${bazi.hour.branch}
  星盘摘要：${astrology.planets.map(p => `${p.name}${p.sign}`).join(', ')}
  
  请以专业、温和、富有洞察力的语气回答用户的问题。`;

  return callWithRetry(async () => {
    const chat = getAI().chats.create({
      model,
      config: { systemInstruction }
    });
    const response = await chat.sendMessage({ message: question });
    return cleanMarkdown(response.text);
  });
}

export async function getFollowUpQuestions(
  info: BirthInfo,
  bazi: BaziData,
  astrology: AstrologyData,
  history: { role: string, text: string }[]
): Promise<string[]> {
  const model = "gemini-3-flash-preview";
  const prompt = `基于用户的命理信息${history.length > 0 ? '和对话历史' : ''}，推荐3个用户可能会感兴趣的${history.length > 0 ? '追问或延伸问题' : '初始咨询问题'}。
  
  要求：
  1. 每个问题必须简短有力，字数严格控制在20个字符以内。
  2. 语气自然，像真实用户的提问。
  3. ${history.length === 0 ? '涵盖事业、感情、财运、健康等不同维度，每次生成请保持多样性和随机性。' : '紧扣当前对话脉络。'}
  
  用户命理摘要：
  八字：${bazi.year.stem}${bazi.year.branch} ${bazi.month.stem}${bazi.month.branch} ${bazi.day.stem}${bazi.day.branch} ${bazi.hour.stem}${bazi.hour.branch}
  星盘：${astrology.planets.map(p => `${p.name}${p.sign}`).join(', ')}
  
  ${history.length > 0 ? `对话历史：\n${history.slice(-4).map(m => `${m.role}: ${m.text}`).join('\n')}` : ''}
  
  请仅返回一个JSON数组，包含3个字符串问题。不要有任何其他文字。`;

  return callWithRetry(async () => {
    const response = await getAI().models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    try {
      return JSON.parse(response.text);
    } catch (e) {
      return ["我未来的事业运势如何？", "我的感情生活会有什么变化？", "我该如何提升自己的财运？"];
    }
  });
}
