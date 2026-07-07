# OpenRepo Mentor Demo 展示

这个页面用于答辩和演示时快速说明工具的输入与输出形式。

## 示例扫描结果

```json
{
  "repoPath": "./sample-project",
  "packageManager": "npm",
  "languages": [
    { "name": "TypeScript", "percentage": 81.2 }
  ],
  "techStack": ["TypeScript", "Node.js"],
  "topLevelDirectories": ["src", "test"]
}
```

## 示例 Issue 分析

```json
{
  "summary": "修复 Windows 路径兼容性问题",
  "type": "bug",
  "difficulty": "medium",
  "relatedFiles": ["src/utils/path.ts", "test/path.test.ts"],
  "suggestedSteps": ["定位路径拼接逻辑", "补充跨平台测试"],
  "risks": ["可能影响现有 POSIX 路径行为"]
}
```

## 示例贡献计划

```json
{
  "goal": "修复路径兼容性并补齐测试",
  "tasks": [
    {
      "title": "修正路径解析逻辑",
      "files": ["src/utils/path.ts"]
    },
    {
      "title": "补充 Windows 场景测试",
      "files": ["test/path.test.ts"]
    }
  ],
  "testPlan": "运行单元测试并手动验证示例路径"
}
```

> 如果 `.orm/final-report.md` 还没有生成，静态网站中的报告页会自动显示占位内容，方便先做页面演示。
