export enum DayStatus {
  LOCKED = 'LOCKED',     // Future date
  PENDING = 'PENDING',   // Today or past, not opened yet
  OPENED = 'OPENED',     // Clicked, waiting for decision
  TAKEN = 'TAKEN',       // Pill taken (+500)
  MISSED = 'MISSED'      // Pill missed (-1000)
}

export interface DayEntry {
  id: string;
  date: string; // ISO String YYYY-MM-DD
  dayOfMonth: number;
  status: DayStatus;
  note?: string; // AI generated note or manual
}

export interface AppState {
  days: DayEntry[];
  balance: number;
  streak: number;
  lastUpdated: number;
}

export interface UserStats {
  totalTaken: number;
  totalMissed: number;
  currentStreak: number;
  balanceHistory: { date: string; balance: number }[];
}