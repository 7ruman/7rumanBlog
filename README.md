# 7ruman的技术博客

零依赖静态博客：写 Markdown 就能发文章，UI 精致、支持深色/浅色、标签筛选与搜索。可直接部署到 CloudStudio / GitHub Pages / Gitee Pages / Cloudflare Pages 等任意静态托管。

## 目录结构

```
my-blog/
├── index.html          # 首页（文章列表 / 标签 / 搜索）
├── post.html           # 文章页（?slug=xxx 加载对应 Markdown）
├── assets/
│   ├── css/style.css   # 样式（双主题、响应式）
│   └── js/
│       ├── markdown.js # 零依赖 Markdown 解析器
│       ├── highlight.js# 轻量语法高亮
│       ├── app.js      # 首页逻辑
│       └── post.js     # 文章页逻辑
├── posts/              # 文章（Markdown）
└── posts.json          # 文章清单（首页读取）
```

## 怎么加一篇新文章

1. 在 `posts/` 新建一个 `.md` 文件，用标准 Markdown 写正文（支持代码块 ```lang、列表、引用、表格、图片）。
2. 在 `posts.json` 顶部加一条：

```json
{
  "slug": "my-post",
  "title": "文章标题",
  "date": "2026-09-20",
  "read": "5 分钟",
  "tags": ["标签A", "标签B"],
  "excerpt": "一句话摘要，显示在首页卡片上。",
  "file": "posts/my-post.md"
}
```

- `slug` 与文件名（去掉 .md）保持一致，且是 `post.html?slug=` 的参数。
- 保存后刷新即可，**无需构建、无需安装任何环境**。

## 本地预览

直接用浏览器打开 `index.html` 即可（需通过 `http://` 访问才能 `fetch` 本地文件；若双击打开遇到 CORS 限制，可起一个本地服务器）：

```bash
python -m http.server 8080
# 然后访问 http://localhost:8080
```

## 部署

- **CloudStudio**：用内置部署技能把本目录上传为静态站点。
- **GitHub Pages / Gitee Pages**：把整个目录推到仓库，开启 Pages，根目录即 `index.html`。
- **Cloudflare Pages**：连接仓库，构建命令留空，输出目录设为 `.`（根目录）。
