export type ImpactLevel = 'High' | 'Medium' | 'Low';

export interface EconomicEvent {
  id?: string;
  time: string;
  currency?: string; // e.g. "USD"
  event: string;
  impact: ImpactLevel;
  actual: string;
  forecast: string;
  previous: string;
  date?: string;
  // Expanded Details
  description?: string;
  source?: string;
  frequency?: string;
  nextRelease?: string;
  history?: { date: string; actual: string; forecast: string; previous: string }[];
  stories?: { title: string; link: string; time: string; source?: string }[];
}
