export interface ScanResult {
  repoPath: string;
  languages: Array<{ name: string; percentage: number }>;
  techStack: string[];
  packageManager: string;
  buildCommand?: string;
  testCommand?: string;
  topLevelDirectories: string[];
  keyFiles: {
    readme: boolean;
    license: boolean;
    contributing: boolean;
    ci: boolean;
  };
}

export interface IssueAnalysis {
  summary: string;
  type: 'bug' | 'feature' | 'refactor' | 'docs' | 'question';
  difficulty: 'easy' | 'medium' | 'hard';
  relatedFiles: string[];
  suggestedSteps: string[];
  risks: string[];
}

export interface ContributionPlan {
  goal: string;
  background: string;
  tasks: Array<{ title: string; description: string; files?: string[] }>;
  testPlan: string;
  prChecklist: string[];
}

export interface ReportInput {
  scanResult: ScanResult;
  issueResult: IssueAnalysis;
  planResult: ContributionPlan;
  members?: string[];
}
