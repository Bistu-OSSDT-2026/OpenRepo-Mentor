# OpenRepo Mentor

A CLI tool to help students practice open-source contribution.

## What it does

OpenRepo Mentor guides students through the open-source practice workflow:

```
Understand project → Analyze issue → Generate plan → Write report
```

It provides four CLI commands:

- `orm scan <repo-path>` — scan a local repository and generate an overview
- `orm issue analyze <issue-file>` — analyze an issue and estimate difficulty
- `orm plan` — generate a contribution plan based on scan and issue analysis
- `orm report` — generate a draft of the final practice report

## Tech Stack

- Node.js ≥22
- TypeScript
- Commander, Chalk, Zod
- OpenAI SDK (Zhipu-compatible endpoint)
- Marked (for static site generation)

## Installation

```bash
cd openrepo-mentor
npm install
npm link
```

## Configuration

Create `.ormrc` in the project root:

```json
{
  "apiKey": "your-zhipu-api-key"
}
```

Or set an environment variable:

```bash
export ORM_ZHIPU_API_KEY="your-zhipu-api-key"
```

## Usage

```bash
orm scan ./target-repo
orm issue analyze ./issue.md
orm plan
orm report --members "Alice,Bob"
```

For testing without an LLM:

```bash
orm scan ./target-repo --mock-llm
orm issue analyze ./issue.md --mock-llm
orm plan --mock-llm
orm report --mock-llm
```

## Development

```bash
npm run build
npm run test:dev
npm run build:site
```

## Project Docs

- `PRD.md` — Product requirements
- `docs/design-spec.md` — Technical design specification
- `docs/implementation-plan.md` — Step-by-step implementation plan
