# OpenRepo Mentor 开发文档

## 项目结构

当前仓库以轻量 TypeScript 项目组织，重点目录如下：

```text
bin/              CLI 可执行入口
docs/             PRD、设计文档、用户指南、Demo 文档
scripts/          构建脚本，例如静态网站生成器
site-template/    静态网站 HTML 模板
src/              CLI 程序入口与后续命令实现
test/             Node 内置测试与测试夹具
```

## 常用命令

```bash
npm run test:dev
npm run build
npm run build:site
```

## Mock LLM 工作流

在没有 API Key 或演示环境受限时，可以先使用 mock 模式跑通 CLI：

```bash
orm scan ./repo --mock-llm
orm issue analyze ./issue.md --mock-llm
orm plan --mock-llm
orm report --mock-llm --site
```

## 静态网站说明

`scripts/build-site.ts` 会读取以下 Markdown 输入并生成 HTML：

- `README.md` -> `site/index.html`
- `docs/user-guide.md` -> `site/guide.html`
- `docs/demo.md` -> `site/demo.html`
- `.orm/final-report.md` -> `site/report.html`

如果某个输入文件暂时缺失，生成器会写入占位内容，保证站点仍然可预览和部署。
