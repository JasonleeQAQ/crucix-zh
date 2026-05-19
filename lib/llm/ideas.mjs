// LLM-Powered Trade Ideas - generates actionable ideas from sweep data + delta context
// Chinese edition: localized system prompt with ICT/SMC trading-flow analysis.

/**
 * Generate LLM-enhanced trade ideas from sweep data.
 * @param {LLMProvider} provider - configured LLM provider
 * @param {object} sweepData - synthesized dashboard data
 * @param {object|null} delta - delta from last sweep
 * @param {Array} previousIdeas - ideas from previous runs (for dedup)
 * @returns {Promise<Array>} - array of idea objects
 */
export async function generateLLMIdeas(provider, sweepData, delta, previousIdeas = []) {
  if (!provider?.isConfigured) return null;

  let context;
  try {
    context = compactSweepForLLM(sweepData, delta, previousIdeas);
  } catch (err) {
    console.error('[LLM Ideas] Failed to compact sweep data:', err.message);
    return null;
  }

  const systemPrompt = `【宏观量化分析师角色】你是一名资深的宏观量化与OSINT分析师，专业背景包括对冲基金交易、智能交易法则(ICT)与智能资金概念(SMC)应用。你接收来自25个全球数据源的结构化OSINT数据和经济指标，并生成5-8个高质量的可交易想法。

【核心任务】分析地缘政治、经济数据、商品、能源、流动性、风险资产异动的潜在关联，通过 ICT/SMC 专业术语呈现交易机会。

【强制规则】
1. 所有最终输出必须使用【专业、高可读性的简体中文】呈现
2. 将突发事件（地缘冲突、大宗商品价格跳跃、网络安全事件等）与金融市场的：
   - 流动性池变化 (Liquidity Pools)
   - 公允价值缺口 (Fair Value Gaps, FVG)
   - 订单块突破 (Order Block Breakout, OB)
   - 关键支撑/阻力位
   - 异常交易量与波动率激增
   进行逻辑关联分析
3. 每个想法必须引用输入数据中的具体数据点
4. 包含入场理由、风险因子、时间跨度（日内/数日/数周/数月）
5. 明确命名交易工具（股票代码、期货、ETF、数字资产），不使用模糊的行业术语
6. 如果Delta显示重大变化，优先突出这些变化
7. 不重复"上一轮想法"列表中的想法，除非市场条件已发生实质性改变
8. 信心评级：HIGH（多个确认信号），MEDIUM（论点有支撑），LOW（投机性）

【输出格式】仅输出有效的JSON数组。每个对象结构：
{
  "title": "简短标题（最多10个字）",
  "type": "LONG|SHORT|HEDGE|WATCH|AVOID",
  "ticker": "主要交易工具",
  "confidence": "HIGH|MEDIUM|LOW",
  "rationale": "2-3句解释，引用具体数据，融合ICT/SMC术语",
  "marketContext": "地缘/经济背景关联分析",
  "liquidityPattern": "流动性模式识别",
  "risk": "关键风险因子",
  "horizon": "日内|数日|数周|数月",
  "signals": ["信号1", "信号2", "信号3"]
}

【语言规范】
- "做多" 而非 "看涨"
- "流动性池" = Liquidity Pools
- "订单块" = Order Block (OB)
- "公允价值缺口" = Fair Value Gap (FVG)
- "反向套利" = Reversal/Retest
- "破位突破" = Breakout from Structure
- "异常成交量" = Abnormal Volume Spike`;

  try {
    const result = await provider.complete(systemPrompt, context, { maxTokens: 4096, timeout: 180000 });
    console.log('[LLM Debug] Raw response length:', result.text?.length);
    console.log('[LLM Debug] First 500 chars:', result.text?.substring(0, 500));
    const ideas = parseIdeasResponse(result.text);
    if (ideas && ideas.length > 0) {
      return ideas;
    }
    console.warn('[LLM Ideas] No valid ideas parsed from response');
    return null;
  } catch (err) {
    console.error('[LLM Ideas] Generation failed:', err.message);
    return null;
  }
}

/**
 * Compact sweep data to ~8KB for token efficiency.
 */
function compactSweepForLLM(data, delta, previousIdeas) {
  const sections = [];

  // Economic indicators
  if (data.fred?.length) {
    const key = data.fred.filter(f => ['VIXCLS', 'DFF', 'DGS10', 'DGS2', 'T10Y2Y', 'BAMLH0A0HYM2', 'DTWEXBGS', 'MORTGAGE30US'].includes(f.id));
    sections.push(`【经济指标】${key.map(f => `${f.id}=${f.value}${f.momChange ? ` (${f.momChange > 0 ? '+' : ''}${f.momChange})` : ''}`).join(', ')}`);
  }

  // Energy
  if (data.energy) {
    sections.push(`【能源】WTI=$${data.energy.wti}, 布伦特油=$${data.energy.brent}, 天然气=$${data.energy.natgas}, 原油库存=${data.energy.crudeStocks}桶`);
  }

  // Metals
  if (data.metals?.gold != null || data.metals?.silver != null) {
    const gold = data.metals?.gold != null ? `$${data.metals.gold}` : '无数据';
    const silver = data.metals?.silver != null ? `$${data.metals.silver}` : '无数据';
    const goldChg = data.metals?.goldChangePct != null ? ` (${data.metals.goldChangePct >= 0 ? '+' : ''}${data.metals.goldChangePct}%)` : '';
    const silverChg = data.metals?.silverChangePct != null ? ` (${data.metals.silverChangePct >= 0 ? '+' : ''}${data.metals.silverChangePct}%)` : '';
    sections.push(`【贵金属】黄金=${gold}${goldChg}, 白银=${silver}${silverChg}`);
  }

  // BLS
  if (data.bls?.length) {
    sections.push(`【劳动力】${data.bls.map(b => `${b.id}=${b.value}`).join(', ')}`);
  }

  // Treasury
  if (data.treasury) {
    sections.push(`【国债】总债务=$${data.treasury}万亿`);
  }

  // Supply chain
  if (data.gscpi) {
    sections.push(`【供应链】GSCPI=${data.gscpi.value} (${data.gscpi.interpretation})`);
  }

  // Geopolitical signals (cap total OSINT text to ~1500 chars to keep prompt compact)
  const urgentPosts = (data.tg?.urgent || []).slice(0, 5);
  if (urgentPosts.length) {
    const MAX_OSINT_CHARS = 1500;
    let remaining = MAX_OSINT_CHARS;
    const lines = [];
    for (const p of urgentPosts) {
      const text = p.text || '';
      if (remaining <= 0) break;
      const trimmed = text.length > remaining ? `${text.substring(0, remaining)}...` : text;
      lines.push(`- ${trimmed}`);
      remaining -= trimmed.length;
    }
    sections.push(`【突发情报】\n${lines.join('\n')}`);
  }

  // Thermal / fire detections
  if (data.thermal?.length) {
    const hotRegions = data.thermal.filter(t => t.det > 10).map(t => `${t.region}: ${t.det} 次探测 (${t.hc} 高置信度)`);
    if (hotRegions.length) sections.push(`【热点异常】${hotRegions.join(', ')}`);
  }

  // Air activity
  if (data.air?.length) {
    const airSum = data.air.map(a => `${a.region}: ${a.total} 架飞机`);
    sections.push(`【空中活动】${airSum.join(', ')}`);
  }

  // Nuclear
  if (data.nuke?.length) {
    const anomalies = data.nuke.filter(n => n.anom);
    if (anomalies.length) sections.push(`【核辐射异常】${anomalies.map(n => `${n.site}: ${n.cpm}cpm`).join(', ')}`);
  }

  // WHO alerts
  if (data.who?.length) {
    sections.push(`【卫生预警】${data.who.slice(0, 3).map(w => w.title).join('; ')}`);
  }

  // Defense spending
  if (data.defense?.length) {
    const topContracts = data.defense.slice(0, 3).map(d => `$${((d.amount || 0) / 1e6).toFixed(0)}百万 至 ${d.recipient}`);
    sections.push(`【军事开支】${topContracts.join(', ')}`);
  }

  // Delta context
  if (delta?.summary) {
    sections.push(`\n【上轮扫描后的变化】方向=${delta.summary.direction}, 变化数=${delta.summary.totalChanges}, 关键变化=${delta.summary.criticalChanges}`);
    if (delta.signals?.escalated?.length) {
      sections.push(`【升级信号】${delta.signals.escalated.map(s => `${s.label}: ${s.previous}->${s.current} (${(s.changePct || 0) > 0 ? '+' : ''}${(s.changePct || 0).toFixed(1)}%)`).join(', ')}`);
    }
    if (delta.signals?.new?.length) {
      sections.push(`【新增信号】${delta.signals.new.map(s => s.label || s.text?.substring(0, 60)).join('; ')}`);
    }
  }

  // Previous ideas (for dedup)
  if (previousIdeas.length) {
    sections.push(`\n【上轮想法】（避免重复）\n${previousIdeas.map(i => `- ${i.title} [${i.type}]`).join('\n')}`);
  }

  return sections.join('\n');
}

/**
 * Parse LLM response into ideas array. Handles markdown code blocks.
 */
function parseIdeasResponse(text) {
  if (!text) return null;

  // Strip markdown code block wrappers
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  try {
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) return null;

    // Validate each idea has required fields
    return parsed.filter(idea =>
      idea.title && idea.type && idea.confidence
    ).map(idea => ({
      title: idea.title,
      type: idea.type,
      ticker: idea.ticker || '',
      confidence: idea.confidence,
      rationale: idea.rationale || '',
      marketContext: idea.marketContext || '',
      liquidityPattern: idea.liquidityPattern || '',
      risk: idea.risk || '',
      horizon: idea.horizon || '',
      signals: idea.signals || [],
      source: 'llm',
    }));
  } catch {
    // Try to extract JSON array from mixed text
    const match = cleaned.match(/\[[\s\S]*\]/);
    if (match) {
      try {
        const arr = JSON.parse(match[0]);
        return arr.filter(i => i.title && i.type).map(idea => ({
          marketContext: idea.marketContext || '',
          liquidityPattern: idea.liquidityPattern || '',
          ...idea,
          source: 'llm',
        }));
      } catch { /* give up */ }
    }
    return null;
  }
}
