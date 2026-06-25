// Gemini AI 提纯引擎
// 预算熔断状态持久化到 D1，防止 Workers 冷启动重置

import { queryOne, execute } from './db';

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

  constructor(config: GeminiConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || DEFAULT_MODEL;
    this.maxTokens = config.maxTokens || 4096;
    this.dailyBudget = 10; // 默认每日10元上限
  }

  // 设置每日预算上限
  setDailyBudget(amount: number) {
    this.dailyBudget = amount;
  }

  // 获取今日已消费金额（从 D1 读取）
  private async getDailySpent(): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    const row = await queryOne<{ total_cost: number }>(
      "SELECT COALESCE(SUM(cost), 0) as total_cost FROM ai_usage_log WHERE date(created_at) = ?",
      today
    );
    return row?.total_cost || 0;
  }

  // 记录消费到 D1
  private async logUsage(tokensIn: number, tokensOut: number, cost: number): Promise<void> {
    try {
      await execute(
        'INSERT INTO ai_usage_log (tokens_in, tokens_out, cost, model, created_at) VALUES (?, ?, ?, ?, datetime("now"))',
        tokensIn, tokensOut, cost, this.model
      );
    } catch {
      // 表可能不存在，静默失败
      console.warn('ai_usage_log table not found, skipping usage tracking');
    }
  }

  // 检查预算熔断
  private async checkBudget(): Promise<boolean> {
    const spent = await this.getDailySpent();
    return spent < this.dailyBudget;
  }

  // 从原始HTML提取结构化数据
  async extractFromHTML(html: string, customPrompt?: string): Promise<ExtractResult> {
    if (!(await this.checkBudget())) {
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
        usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
      };
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      
      // 提取JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('AI返回格式异常');
      
      // 基于 token 用量计算费用
      const tokensIn = data.usageMetadata?.promptTokenCount || 0;
      const tokensOut = data.usageMetadata?.candidatesTokenCount || 0;
      const cost = (tokensIn * 0.00001) + (tokensOut * 0.00003); // 粗略估算
      await this.logUsage(tokensIn, tokensOut, cost);

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

// 非单例 —— 每次调用传入最新 apiKey
export function getAIClient(apiKey: string): AIClient {
  return new AIClient({ apiKey });
}
