export interface Catch {
  n_catch: number;
  alert_flag?: string;
}

export interface SurveyFlag {
  _id: string;
  submission_id: string;
  n_catch: number;
  alert_flag?: string;
  catches: Catch[];
  total_alerts: number;
}

export interface SurveyResponse {
  submission_id: string;
  catches: Array<{
    n_catch: number;
    alert_flag?: string;
  }>;
  total_alerts: number;
} 