# My Mini Tools

几个我自己开发、主要在手机上用的小工具。
A collection of small, mobile-first tools I built.

## 项目列表 (Projects)

| 目录 | 说明 | 技术 |
| --- | --- | --- |
| [`bill-manager/`](bill-manager/) | **账单管家**：食品店多店面的进货账单录入与月度申报统计，可导出 Excel/CSV | React + Vite + Tailwind，PWA，数据存本机 |
| [`finance-manager/`](finance-manager/) | **个人记账本**：个人收支分类记账、月度/年度统计 | React + Vite + Tailwind，PWA，数据存本机 |
| [`supermarket-comparator/`](supermarket-comparator/) | **超市比价器**：Mercadona / HiperDino / Carrefour / Spar 同时搜索比价 | Next.js 前端 + FastAPI/Playwright 后端 |

## 手机上直接用

**https://weijzzz.github.io/my-mini-tools/** —— 打开后在 Chrome 菜单里「添加到主屏幕」。
每次推送到 `master`，GitHub Actions 会自动重新构建并发布（`.github/workflows/deploy-pages.yml`）。

## 运行方式 (How to run)

两个记账 App：

```bash
cd bill-manager        # 或 finance-manager
npm install
npm run dev            # 开发
npm run build          # 生成 dist/，放到任意 HTTPS 静态托管即可在手机「添加到主屏幕」
```

比价器的前后端运行方式见 [supermarket-comparator/README.md](supermarket-comparator/README.md)。
