# OpenRepo Mentor 用户指南

## 安装

```bash
npm install
npm link
```

## 配置

创建 `.ormrc`：

```json
{
  "apiKey": "你的智谱 API Key"
}
```

也可以直接设置环境变量：

```bash
export ORM_ZHIPU_API_KEY="你的智谱 API Key"
```

## 使用流程

OpenRepo Mentor 面向课程实践的典型流程如下：

```bash
orm scan ./target-repo
orm issue analyze ./issue.md
orm plan
orm report --members "姚权秩,徐泽铖,白一百,王冬岩,许琢章"
```

如果只是演示流程、不希望调用真实 LLM，可以启用 mock 模式：

```bash
orm scan ./target-repo --mock-llm
orm issue analyze ./issue.md --mock-llm
orm plan --mock-llm
orm report --mock-llm --site
```

## 站点生成

执行下面的命令会把 Markdown 文档转换成静态网页：

```bash
npm run build:site
```

构建结果输出到 `site/` 目录，可直接部署到 GitHub Pages、Vercel 或 Netlify。
