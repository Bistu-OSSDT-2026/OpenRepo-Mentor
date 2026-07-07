# OpenRepo Mentor 开发文档

## 项目结构

当前仓库采用轻量 TypeScript CLI 结构：

```text
bin/              CLI 可执行入口
docs/             设计与用户文档
scripts/          独立构建脚本
site-template/    静态网站模板
src/              CLI 与核心源码
test/             Node 内置测试
```

## 常用命令

```bash
npm run build
npm run test:dev
npm run build:site
```

## Mock LLM 工作流

```bash
orm scan ./repo --mock-llm
orm issue analyze ./issue.md --mock-llm
orm plan --mock-llm
orm report --mock-llm --site
```

## 静态网站生成器

`build:site` 会把这些 Markdown 文件转换成 HTML 页面：

- `README.md` -> `site/index.html`
- `docs/user-guide.md` -> `site/guide.html`
- `docs/demo.md` -> `site/demo.html`
- `.orm/final-report.md` -> `site/report.html`

如果报告暂时没有生成，构建器会自动写入占位内容，保证网站依然可预览、可部署。
