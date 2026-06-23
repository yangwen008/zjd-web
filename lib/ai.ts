// Gemini AI 提纯引擎

interface GeminiConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
}

interface ExtractResult {
  title: string;
  location: string;
  area_mu: number | null;
  price_year: number | null;
  asset_type: string;
  description: string;
  contact_hint: string;
  [key: string]: unknown;
}

const DEFAULT_MODEL = 'gemini-2.0-flash';

export class AIClient {
  private apiKey: string;
  private model: string;
  private maxTokens: number;
  private dailyBudget: number;
  private dailySpent: number = 0;

  constructor(config: GeminiConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || DEFAULT_MODEL;
    this.maxTokens = config.maxTokens || 4096;
    this.dailyBudget = 10; // 默认每日10元上限
  }

  // 检查预算熔断
  private checkBudget(): boolean {
    return this.dailySpent < this.dailyBudget;
  }

  // 设置每日预算上限
  setDailyBudget(amount: number) {
    this.dailyBudget = amount;
  }

  // 从原始HTML提取结构化数据
  async extractFromHTML(html: string, customPrompt?: string): Promise<ExtractResult> {
    if (!this.checkBudget()) {
      throw new Error('BUDGET_KILLED: 今日AI消费已达上限，已自动熔断');
    }

    const prompt = customPrompt || `你是乡村资产数据提取专家。从以下HTML中提取结构化数据，返回JSON格式：

要求提取的字段：
- title: 资产标题
- location: 完整地址
- area_mu: 面积(亩)，数字
- price_year: 年租金(万)，数字
- asset_type: 资产类型(宅基地/林地/茶园/厂房/古宅等)
- description: 资产描述(50字以内)
- contact_hint: 联系方式提示

如果某个字段无法提取，返回null。只返回JSON，不要其他文字。

HTML内容：
${html.substring(0, 8000)}`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              maxOutputTokens: this.maxTokens,
              temperature: 0.1,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json() as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      
      // 提取JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('AI返回格式异常');
      
      this.dailySpent += 0.01; // 粗略计费
      return JSON.parse(jsonMatch[0]) as ExtractResult;
    } catch (error) {
      console.error('AI extraction failed:', error);
      throw error;
    }
  }

  // UGC智能秒填
  async extractFromUserInput(text: string): Promise<ExtractResult> {
    const prompt = `用户输入了一段乡村资产的口头描述，请提取结构化信息，返回JSON：

字段：title, location, area_mu(亩), price_year(万/年), asset_type, description

用户输入：
${text}`;

    return this.extractFromHTML(text, prompt);
  }
}

// 单例
let aiClient: AIClient | null = null;

export function getAIClient(apiKey: string): AIClient {
  if (!aiClient) {
    aiClient = new AIClient({ apiKey });
  }
  return aiClient;
}
