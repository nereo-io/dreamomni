export interface ReadingRecord {
  id?: number;
  user_uuid: string;
  read_date: string; // YYYY-MM-DD
  count: number;
  created_at: string;
  updated_at: string;
} 