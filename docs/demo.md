# OpenRepo Mentor Demo 展示

这个页面用于答辩或课程展示时快速说明工具的输入与输出形式。

## 1. 示例扫描输出

```json
{
  "name": "sample-project",
  "language": "TypeScript",
  "packageManager": "npm",
  "scripts": ["build", "test"],
  "highlights": ["识别项目结构", "提取关键脚本"]
}
```

## 2. 示例 Issue 分析

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

## 3. 示例贡献计划

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

## 4. 示例报告片段

```markdown
## 3. Issue 分析

目标 Issue 聚焦在跨平台路径处理。项目当前在 Windows 上存在路径识别异常，因此优先级较高。
```

> 如果 `.orm/final-report.md` 还没有生成，站点会自动显示占位内容，方便先做页面演示。
