
export enum RiskLevel {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High'
}

export interface RiskItem {
  name: string;
  why: string;
  reference: string;
  severity: RiskLevel;
}

export interface Suggestion {
  riskName: string;
  action: string;
}

export interface AuditReport {
  riskLevel: RiskLevel;
  riskJustification: string;
  suggestedProjectName: string;
  topRisks: RiskItem[];
  fixNowSuggestions: Suggestion[];
}

export interface AuditHistoryItem {
  id: string;
  timestamp: number;
  riskLevel: RiskLevel;
  projectName: string;
  report: AuditReport;
  plan: string;
}

export interface AppState {
  projectPlan: string;
  report: AuditReport | null;
  history: AuditHistoryItem[];
  isLoading: boolean;
  error: string | null;
}
