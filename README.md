# Crucix

<div align="center">

<h3>🧠 你的私人情报终端——29 个 OSINT 数据源，一行命令，零云依赖</h3>

**坐在家里，看见世界。地球每一个角落的火焰、航班、辐射、冲突、制裁、市场，每 15 分钟汇聚到一张屏幕上。**

[![Live](https://img.shields.io/badge/⚡-在线演示-crucix.live-00d4ff?style=for-the-badge)](https://www.crucix.live/)
[![License: AGPL v3](https://img.shields.io/badge/license-AGPLv3-blue.svg)](LICENSE)
[![Node 22+](https://img.shields.io/badge/node-22%2B-brightgreen)](https://nodejs.org)
[![Docker](https://img.shields.io/badge/docker-ready-blue?logo=docker)](https://docs.docker.com)
[![Sources](https://img.shields.io/badge/情报源-29个-cyan)]()

<br/>

**🔗 信号网络**

[![X/Twitter](https://img.shields.io/badge/Signal_Wire-@crucixmonitor-111111?style=for-the-badge&logo=x&logoColor=white)](https://x.com/crucixmonitor)
[![Discord](https://img.shields.io/badge/作战室-Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/ChVy7SF4)

<br/>

<picture>
  <img alt="Crucix Dashboard" src="docs/dashboard.png" width="90%">
</picture>

</div>

---

## 🤔 这是什么？

Crucix 是一个**本地运行的开源情报仪表板**。它每 15 分钟自动从 29 个开放数据源并行抓取情报——卫星热源、航班轨迹、核辐射、太空物体、经济指标、实时市场、制裁名单、冲突事件、社交媒体舆论——然后渲染到一个 Jarvis 风格的实时面板上。

**不需要付费 API，不需要云服务。** clone 下来，配置几个免费 key，`npm start`，你就是自己的情报中心。

> 🚀 **等不及了？** 直接访问线上演示：[crucix.live](https://www.crucix.live/)

## ✨ 为什么选 Crucix？

<table>
<tr>
<td width="50%">

### 🛰️ 全维度情报覆盖
- 🔥 **野火/热异常** — NASA FIRMS 卫星数据
- ✈️ **航班追踪** — OpenSky ADS-B，6 大热点区域
- ☢️ **核辐射监测** — Safecast 6 个核设施实时数据
- 🚀 **太空监测** — 30 日新增天体、军事卫星、星链
- 📡 **SDR 频谱节点** — KiwiSDR 全球部署

</td>
<td width="50%">

### 📊 金融 & 经济
- 📈 **实时市场** — 标普500、纳斯达克、道琼斯、比特币、以太坊
- 🏦 **宏观经济** — FRED（20 项）、BLS（CPI/失业率）、EIA（能源）
- 💰 **财政数据** — 财政部拍卖、USASpending

### ⚔️ 冲突 & 制裁
- 💣 **武装冲突** — ACLED 全球战事
- 🚫 **制裁名单** — OFAC、OpenSanctions
- 🚢 **船舶追踪** — AIS 暗船检测

</td>
</tr>
</table>

### 🔔 异常信号引擎
内置 Delta 检测引擎，自动发现异常：
- **事件频率** — 冲突、抗议的突发激增
- **空中战区** — 航班异常消失/聚集
- **热源尖峰** — 火灾/爆炸卫星热信号
- **SDR 节点** — 全球频谱异常
- **战略要道** — 关键海峡/运河船只异常
- **世卫预警** — 传染病爆发信号

### 🌐 中文友好
- 内置 LLM 翻译层（新闻、Telegram 情报、OSINT 报告自动汉化）
- 信号说明、面板标签、核监测、经济数据标签全部中文
- 支持 NVIDIA API、OpenAI、Anthropic 等多种模型后端

### ⚡ 极简架构
```
Express（1 个依赖）+ 静态 HTML 面板 + 29 个数据源模块
```
没有 React/Vue/Webpack。一个 `node server.mjs`，全搞定。

---

## 🚀 快速开始

```bash
# 1. 克隆仓库
git clone https://github.com/JasonleeQAQ/crucix-zh.git
cd Crucix

# 2. 安装依赖（只有一个 Express）
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑.env，填入你的 API keys（大部分数据源免费）

# 4. 启动！
npm run dev
```

浏览器自动打开 `http://localhost:3117`。

## 🐳 Docker 部署

```bash
git clone https://github.com/JasonleeQAQ/crucix-zh.git
cd Crucix
cp .env.example .env    # 配置你的 API keys
docker compose up -d
```

仪表板在 `http://localhost:3117`。数据通过 volume 持久化到 `./runs/`。

---

## 🗺️ 29 个数据源

| 层级 | 类别 | 数据源 |
|:---:|------|--------|
| **T1** | 核心情报 (11) | GDELT · OpenSky · NASA FIRMS · AIS船舶 · Safecast核辐射 · ACLED冲突 · ReliefWeb · WHO · OFAC · OpenSanctions · Cloudflare Radar |
| **T2** | 市场 & 经济 (7) | Yahoo Finance · FRED · BLS · EIA · EPA · USASpending · 财政部 |
| **T3** | 社交 & 舆论 (6) | Telegram · Reddit · Bluesky · GSCPI · Google Patents · Comtrade |
| **T4** | 扩展监测 (5) | CISA KEV · NOAA · 太空物体 · KiwiSDR · Delta 引擎 |

---

## 🧠 LLM 增强（可选）

Crucix 完全可以在无 LLM 的情况下运行。但接入后能获得：

- 📰 **新闻自动翻译** — 50 条全球新闻 → 中文
- 💬 **Telegram 情报翻译** — 14 条紧急 + 5 条热门
- 📊 **AI 交易建议** — 市场数据分析 + 操作建议

```env
# .env 配置
LLM_PROVIDER=openai           # 支持 openai / anthropic / openrouter / minimax / ollama / grok
LLM_API_KEY=sk-xxx
LLM_MODEL=qwen/qwen3-coder-480b-a35b-instruct
LLM_BASE_URL=https://api.openai.com/v1   # 可选，支持自定义 endpoint
```

---

## 📁 项目结构

```
crucix/
├── server.mjs              # Express 服务器（SSE 推送、自动刷新、LLM、Bot 命令）
├── crucix.config.mjs       # 配置文件（全部可环境变量覆盖）
├── diag.mjs                # 诊断工具——启动失败排障
├── .env.example            # 完整环境变量文档
│
├── apis/
│   ├── briefing.mjs        # 总指挥——并行运行全部 29 个数据源
│   ├── save-briefing.mjs   # CLI：保存带时间戳 + latest.json
│   ├── sources/            # 29 个数据源模块，每个独立可测
│   └── utils/              # fetch 工具、重试逻辑
│
├── dashboard/
│   ├── public/jarvis.html  # Jarvis 风格单页仪表板
│   └── inject.mjs          # 数据合成 + 翻译编排
│
├── lib/
│   ├── delta/              # Delta 异常检测引擎
│   ├── llm/                # LLM provider（OpenAI/Anthropic/Gemini 等）
│   ├── alerts/             # 告警模块（Email/Discord/Telegram）
│   ├── cache.mjs           # 缓存管理器
│   ├── translate.mjs       # 翻译层（LLM + 静态字典）
│   └── i18n.mjs            # 国际化
│
└── runs/                   # 扫掠数据持久化
    ├── latest.json         # 最新数据
    └── cache/              # 翻译缓存
```

---

## 🔧 故障排查

```bash
# 如果 npm run dev 静默退出
node --trace-warnings server.mjs

# 全面诊断
node diag.mjs

# 手动扫掠一次
node apis/briefing.mjs

# 清理并重启
npm run fresh-start
```


## 📄 许可证

AGPL-3.0 — 你可以自由使用、修改、分发，但修改后的代码也必须以相同许可证开源。

---

<p align="center">
  <sub>Built with ❤️ by <a href="https://github.com/calesthio">calesthio</a> · Powered by 29 OSINT sources · One planet, one terminal</sub>
</p>
