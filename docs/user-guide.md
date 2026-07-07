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

或者直接设置环境变量：

```bash
export ORM_ZHIPU_API_KEY="你的智谱 API Key"
```

## 使用流程

典型课程实践流程如下：

```bash
orm scan ./target-repo
orm issue analyze ./issue.md
orm plan
orm report --members "姚权秩,徐泽铖,白一百,王冬岩,许琢章"
```

如果只是演示流程，可以打开 mock 模式：

```bash
orm scan ./target-repo --mock-llm
orm issue analyze ./issue.md --mock-llm
orm plan --mock-llm
orm report --mock-llm --site
```

## 构建网站

```bash
npm run build:site
```

命令会读取 `README.md`、`docs/user-guide.md`、`docs/demo.md` 与 `.orm/final-report.md`，并在 `site/` 输出静态网页。
