// Chinese Translation Layer for Crucix
// Uses LLM for dynamic content translation, dictionary only for static labels

// === Static Label Dictionary (never-changing UI labels) ===
const STATIC_DICT = {
  'S&P 500': '标普500', 'S&P500': '标普500', 'SPX': '标普500',
  'Nasdaq Composite': '纳斯达克综合', 'NASDAQ': '纳斯达克',
  'Dow Jones': '道琼斯', 'Russell 2000': '罗素2000',
  'Bitcoin': '比特币', 'BTC': '比特币',
  'Ethereum': '以太坊', 'ETH': '以太坊',
  'WTI Crude': 'WTI原油', 'WTI': 'WTI',
  'Brent': '布伦特原油', 'Nat Gas': '天然气',
  'Gold': '黄金', 'Silver': '白银', 'VIX': '恐慌指数',
  'Fed Funds': '联邦基金利率', 'GSCPI': '全球供应链压力指数',
  'CPI MoM': 'CPI月率', 'Unemployment': '失业率',
  'INDEXES': '市场指数', 'CRYPTO': '加密货币',
};

// === Static label translation (not LLM) ===
function translateStatic(text) {
  if (!text || typeof text !== 'string') return text;
  let result = text;
  const keys = Object.keys(STATIC_DICT).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    result = result.split(key).join(STATIC_DICT[key]);
  }
  return result;
}

// === LLM Batch Translation ===
// Translates multiple English texts to Chinese in a single API call
async function llmBatchTranslate(llmProvider, texts, maxBatch = 20) {
  if (!llmProvider || !llmProvider.isConfigured || !texts || !texts.length) return texts;

  const results = [];
  const batches = [];

  // Split into batches
  for (let i = 0; i < texts.length; i += maxBatch) {
    batches.push(texts.slice(i, i + maxBatch));
  }

  for (const batch of batches) {
    const numbered = batch.map((t, i) => `[${i}] ${t}`).join('\n');

    try {
      const result = await llmProvider.complete(
        '你是一个专业翻译。将以下每条英文翻译成简体中文。保持编号 [N] 前缀，每行一条翻译，不要加任何解释。',
        numbered,
        { maxTokens: 2048, timeout: 90000 }
      );

      const translated = (result?.text || '')
        .split('\n')
        .map(line => {
          const match = line.match(/^\[(\d+)\]\s*(.+)/);
          if (match) {
            const idx = parseInt(match[1]);
            const text = match[2].trim();
            if (idx < batch.length) results[idx + (batches.indexOf(batch) * maxBatch)] = text;
          }
          return null;
        });
    } catch (e) {
      console.warn('[Translate] LLM batch failed:', e.message);
      // Fall back: return originals for this batch
      const offset = batches.indexOf(batch) * maxBatch;
      for (let i = 0; i < batch.length; i++) {
        results[offset + i] = batch[i];
      }
    }
  }

  // Fill any gaps with originals
  for (let i = 0; i < texts.length; i++) {
    if (!results[i]) results[i] = texts[i];
  }

  return results;
}

// Translate array of objects' specified fields using LLM
async function llmTranslateItems(llmProvider, items, field, maxBatch) {
  if (!items || !items.length || !llmProvider?.isConfigured) return items;

  const texts = items.map(item => item[field] || '');
  const translated = await llmBatchTranslate(llmProvider, texts, maxBatch || 20);

  for (let i = 0; i < items.length; i++) {
    if (translated[i] && translated[i] !== items[i][field]) {
      items[i][field] = translated[i];
    }
  }

  return items;
}

export { STATIC_DICT, translateStatic, llmBatchTranslate, llmTranslateItems };
