export type TransactionType = 'income' | 'expense' | 'transfer';

export type ExpenseCategory =
  | 'Oziq-ovqat'
  | 'Uy-joy va kommunal'
  | 'Transport'
  | 'Ta\'lim va rivojlanish'
  | 'Sog\'liq'
  | 'Ko\'ngilochar'
  | 'Texnika va xaridlar'
  | 'Boshqa xarajat';

export type IncomeCategory =
  | 'Asosiy maosh'
  | 'Frilans loyiha'
  | 'Investitsiya va dividend'
  | 'Qo\'shimcha daromad';

export type TransferCategory =
  | 'Kartadan kartaga'
  | 'Jamg\'armaga o\'tkazma'
  | 'P2P shaxsiy o\'tkazma'
  | 'Naqdlashtirish';

export type TransactionCategory =
  | ExpenseCategory
  | IncomeCategory
  | TransferCategory;

export interface Transaction {
  id: string;
  title: string;
  amount: number; // Always stored in UZS
  type: TransactionType;
  category: TransactionCategory;
  date: string; // YYYY-MM-DD
  note?: string;
  fromAccount?: string;
  toAccount?: string;
  linkedGoalId?: string;
}

export interface BudgetLimit {
  category: ExpenseCategory;
  limit: number; // Monthly limit in UZS
}

export interface FinancialGoal {
  id: string;
  title: string;
  category: string;
  targetAmount: number;
  currentAmount: number;
  monthlyContribution: number;
  targetDate: string; // YYYY-MM
  createdAt: string;
}

export type NotificationLevel = 'warning' | 'danger' | 'insight' | 'success';

export interface AppNotification {
  id: string;
  level: NotificationLevel;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  goalId?: string;
}

export type CurrencyMode = 'UZS' | 'USD';
export type PeriodFilter = 'this_month' | 'last_month' | '3_months' | '6_months' | 'all';
export type NavTab =
  | 'overview'
  | 'transactions'
  | 'budgets'
  | 'goals'
  | 'analytics'
  | 'settings';

export type SpendingTierKey = 'alo' | 'yaxshi' | 'normal' | 'kop' | 'juda_kop';

export interface SpendingAssessment {
  tier: SpendingTierKey;
  label: string;
  ratioPercent: number;
  headline: string;
  advice: string;
  isCritical: boolean;
}

export interface UserProfile {
  fullName: string;
  role: string;
  email: string;
  avatarUrl: string;
  pinCode: string;
  pinEnabled: boolean;
  isRegistered: boolean;
  budgetAlertsEnabled: boolean;
  spendingGuardEnabled: boolean;
  goalGuardEnabled: boolean;
}

export interface GoalProjection {
  remainingAmount: number;
  progressPercent: number;
  monthsAtPlannedPace: number | null;
  projectedDatePlanned: string;
  monthsAtActualPace: number | null;
  projectedDateActual: string;
  amountIn3Months: number;
  amountIn6Months: number;
  amountIn12Months: number;
  paceVerdict: string;
  paceComparisonNote: string;
}
