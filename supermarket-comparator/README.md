# 超市比价器 (supermarket-comparator)

同时搜索 Mercadona、HiperDino、Carrefour、Spar（Las Palmas 邮编），把同一商品按名称和规格分组对比价格。

- `backend/`：FastAPI + Playwright 爬虫（四家店并发抓取）
- `frontend/`：Next.js 页面（可装成手机 PWA）

## 运行

```bash
# 后端（默认端口 8001）
cd backend
pip install -r requirements.txt
playwright install chromium
python main.py

# 前端（默认端口 3000）
cd frontend
npm install
npm run dev -- -H 0.0.0.0
```

## 在手机上用

电脑和手机连同一个 Wi‑Fi，手机浏览器打开 `http://<电脑的局域网 IP>:3000`。
前端会自动去连同一台电脑的 `:8001` 后端；后端已允许局域网地址跨域访问。

如果后端部署在别处，构建前端时设置 `NEXT_PUBLIC_API_BASE=https://你的后端地址`。

## 后端可调参数（环境变量）

| 变量 | 默认 | 作用 |
| --- | --- | --- |
| `PORT` | `8001` | 后端端口 |
| `SEARCH_CACHE_TTL` | `600` | 同一搜索结果缓存秒数（每次搜索要开 4 个浏览器，缓存能让重复搜索秒出） |
| `SCRAPER_TIMEOUT` | `90` | 单个超市最长等待秒数，超时就先返回其他超市的结果 |
| `CORS_ORIGINS` | 空 | 额外允许的前端地址，逗号分隔 |
| `GEMINI_API_KEY` | 空 | 拍照识别用（目前 `/api/process-image` 仍是固定返回的演示数据） |

## 已知限制

- 拍照识别是模拟的：不管拍什么都返回 "ColaCao Cacao soluble Original 1kg"。
- 后端里的门店距离是随机生成的演示数据，前端已不再显示。
- 超市网站改版后选择器会失效；失效时爬虫会在 `backend/` 下写 `dump_*.txt/png` 方便排查（已加入 .gitignore）。
