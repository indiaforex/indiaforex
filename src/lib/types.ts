export type ImpactLevel = 'High' | 'Medium' | 'Low';

export interface HistoryItem {
  date: string;
  actual: string;
  forecast: string;
  previous?: string;
}

export interface StoryItem {
  title: string;
  link: string;
  time: string;
  source?: string;
}

export interface EconomicEvent {
  id?: string;
  time: string;
  currency?: string;
  event: string;
  impact: ImpactLevel;
  actual: string;
  forecast: string;
  previous: string;
  date?: string;
  description?: string;
  source?: string;
  frequency?: string;
  nextRelease?: string;
  history?: HistoryItem[];
  stories?: StoryItem[];
}
