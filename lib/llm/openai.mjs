// OpenAI Provider — raw fetch, no SDK
// 【修改版】支持自定义 baseUrl，完美兼容 NVIDIA API

import { LLMProvider } from './provider.mjs';
import { rateLimitedCall } from './ratelimit.mjs';

export class OpenAIProvider extends LLMProvider {
  constructor(config) {
    super(config);
    this.name = 'openai';
    this.apiKey = config.apiKey;
    this.model = config.model || 'gpt-5.4';
    // 【新增】支持自定义 baseUrl，用于 NVIDIA、Azure、本地部署等
    this.baseUrl = (config.baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
  }

  get isConfigured() { return !!this.apiKey; }

  async complete(systemPrompt, userMessage, opts = {}) {
    // 构建 API 端点 URL
    const apiUrl = `${this.baseUrl}/chat/completions`;
    
        const doFetch = () => fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        max_completion_tokens: opts.maxTokens || 4096,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      }),
      signal: AbortSignal.timeout(opts.timeout || 120000),
    });
    const res = await rateLimitedCall(doFetch);


    if (res.status === 429 || res.status === 503) {
      // Rate limited - wait and retry once
      await new Promise(r => setTimeout(r, 2000));
      const retryRes = await rateLimitedCall(doFetch);
      if (!retryRes.ok) {
        const retryErr = await retryRes.text().catch(() => "");
        throw new Error(`OpenAI-compatible API ${retryRes.status} (${this.baseUrl}): ${retryErr.substring(0, 200)}`);
      }
      const retryData = await retryRes.json();
      const retryText = retryData.choices?.[0]?.message?.content || "";
      return {
        text: retryText,
        usage: {
          inputTokens: retryData.usage?.prompt_tokens || 0,
          outputTokens: retryData.usage?.completion_tokens || 0,
        },
        model: retryData.model || this.model,
      };
    }
    if (!res.ok) {
      const err = await res.text().catch(() => '');
      throw new Error(`OpenAI-compatible API ${res.status} (${this.baseUrl}): ${err.substring(0, 200)}`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || '';

    return {
      text,
      usage: {
        inputTokens: data.usage?.prompt_tokens || 0,
        outputTokens: data.usage?.completion_tokens || 0,
      },
      model: data.model || this.model,
    };
  }
}
