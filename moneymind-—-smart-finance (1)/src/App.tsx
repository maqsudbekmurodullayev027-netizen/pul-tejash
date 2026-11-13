import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Bell,
  LayoutDashboard,
  ListOrdered,
  Lock,
  Menu,
  Moon,
  PiggyBank,
  Plus,
  RotateCcw,
  Settings,
  Sun,
  Target,
  X,
} from 'lucide-react';
import {
  AppNotification,
  BudgetLimit,
  CurrencyMode,
  ExpenseCategory,
  FinancialGoal,
  NavTab,
  PeriodFilter,
  Transaction,
  UserProfile,
} from './types/finance';
import {
  INITIAL_BUDGETS,
  INITIAL_GOALS,
  INITIAL_NOTIFICATIONS,
  INITIAL_TRANSACTIONS,
} from './data/seedData';
import {
  CURRENT_MONTH_PREFIX,
  REFERENCE_DATE,
  assessSpendingLevel,
  computeAverageMonthlyNetSavings,
  evaluateExpenseRisk,
  exportAllDataJSON,
  exportTransactionsCSV,
  formatMoney,
} from './utils/finance';
import { OverviewView } from './components/OverviewView';
import { TransactionsView } from './components/TransactionsView';
import { BudgetPlannerView } from './components/BudgetPlannerView';
import { GoalsView } from './components/GoalsView';
import { AnalyticsView } from './components/AnalyticsView';
import { SettingsView } from './components/SettingsView';
import { LoginScreen } from './components/LoginScreen';
import {
  GoalContributeModal,
  GoalModal,
  GoalWithdrawWarningModal,
  TransactionModal,
} from './components/Modals';
import {
  NotificationsDrawer,
  ToastAlertStack,
} from './components/NotificationsDrawer';

const STORAGE_KEYS = {
  transactions: 'moneymind_transactions_v1',
  budgets: 'moneymind_budgets_v1',
  goals: 'moneymind_goals_v1',
  notifications: 'moneymind_notifications_v1',
  currency: 'moneymind_currency_v1',
  theme: 'moneymind_theme_v1',
  surveyDismissed: 'moneymind_survey_dismissed_v1',
  profile: 'moneymind_profile_v1',
};

const DEFAULT_PROFILE: UserProfile = {
  fullName: 'Maqsudbek Murodullayev',
  role: 'Smart Finance',
  email: 'maqsudbekmurodullayev027@gmail.com',
  avatarUrl: '/src/assets/images/avatar_user_profile_1794566864752.jpg',
  pinCode: '2026',
  pinEnabled: true,
  isRegistered: false,
  budgetAlertsEnabled: true,
  spendingGuardEnabled: true,
  goalGuardEnabled: true,
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [period, setPeriod] = useState<PeriodFilter>('this_month');
  const [currency, setCurrency] = useState<CurrencyMode>(() =>
    loadFromStorage<CurrencyMode>(STORAGE_KEYS.currency, 'UZS')
  );
  const [isDark, setIsDark] = useState<boolean>(() =>
    loadFromStorage<boolean>(STORAGE_KEYS.theme, false)
  );

  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    loadFromStorage<Transaction[]>(STORAGE_KEYS.transactions, INITIAL_TRANSACTIONS)
  );
  const [budgets, setBudgets] = useState<BudgetLimit[]>(() =>
    loadFromStorage<BudgetLimit[]>(STORAGE_KEYS.budgets, INITIAL_BUDGETS)
  );
  const [goals, setGoals] = useState<FinancialGoal[]>(() =>
    loadFromStorage<FinancialGoal[]>(STORAGE_KEYS.goals, INITIAL_GOALS)
  );
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    loadFromStorage<AppNotification[]>(
      STORAGE_KEYS.notifications,
      INITIAL_NOTIFICATIONS
    )
  );

  const [userProfile, setUserProfile] = useState<UserProfile>(() =>
    loadFromStorage<UserProfile>(STORAGE_KEYS.profile, DEFAULT_PROFILE)
  );
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    const saved = loadFromStorage<UserProfile>(
      STORAGE_KEYS.profile,
      DEFAULT_PROFILE
    );
    return !saved.isRegistered || Boolean(saved.pinEnabled);
  });

  const [toasts, setToasts] = useState<AppNotification[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [surveyDismissed, setSurveyDismissed] = useState<boolean>(() =>
    loadFromStorage<boolean>(STORAGE_KEYS.surveyDismissed, false)
  );

  // Modal states
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);
  const [contributeGoal, setContributeGoal] = useState<FinancialGoal | null>(null);
  const [withdrawGoal, setWithdrawGoal] = useState<FinancialGoal | null>(null);

  // Sync theme to documentElement
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(STORAGE_KEYS.theme, JSON.stringify(isDark));
  }, [isDark]);

  // Persist domain state
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.budgets, JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.goals, JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.notifications,
      JSON.stringify(notifications)
    );
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.currency, JSON.stringify(currency));
  }, [currency]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.surveyDismissed,
      JSON.stringify(surveyDismissed)
    );
  }, [surveyDismissed]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(userProfile));
    setAvatarError(false);
  }, [userProfile]);

  const actualMonthlyNetPace = useMemo(
    () => computeAverageMonthlyNetSavings(transactions),
    [transactions]
  );

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const pushAlert = (
    level: AppNotification['level'],
    title: string,
    message: string,
    goalId?: string
  ) => {
    const notif: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      level,
      title,
      message,
      createdAt: `${REFERENCE_DATE}T${new Date().toTimeString().slice(0, 8)}`,
      read: false,
      goalId,
    };
    setNotifications((prev) => [notif, ...prev]);
    setToasts((prev) => [notif, ...prev].slice(0, 3));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== notif.id));
    }, 6000);
  };

  // Transaction Handlers
  const handleSaveTransaction = (
    payload: Omit<Transaction, 'id'>,
    existingId?: string
  ) => {
    if (existingId) {
      setTransactions((prev) =>
        prev.map((t) => (t.id === existingId ? { ...payload, id: existingId } : t))
      );
      pushAlert(
        'insight',
        'Operatsiya yangilandi',
        `"${payload.title}" (${formatMoney(payload.amount, currency)}) saqlandi.`
      );
      return;
    }

    if (payload.type === 'expense') {
      if (userProfile.budgetAlertsEnabled) {
        const risk = evaluateExpenseRisk(
          payload.amount,
          payload.category as ExpenseCategory,
          transactions,
          budgets,
          currency
        );
        if (risk.budgetWarning) {
          pushAlert(
            risk.severity === 'danger' ? 'danger' : 'warning',
            'Byudjet ogohlantirishi',
            risk.budgetWarning
          );
        } else if (risk.savingsWarning) {
          pushAlert(
            risk.severity === 'danger' ? 'danger' : 'warning',
            'Tejamkorlik ogohlantirishi',
            risk.savingsWarning
          );
        }
      }

      if (userProfile.spendingGuardEnabled) {
        const monthTx = transactions.filter((t) =>
          t.date.startsWith(CURRENT_MONTH_PREFIX)
        );
        const monthIncome = monthTx
          .filter((t) => t.type === 'income')
          .reduce((s, t) => s + t.amount, 0);
        const monthExpense =
          monthTx
            .filter((t) => t.type === 'expense')
            .reduce((s, t) => s + t.amount, 0) + payload.amount;
        const level = assessSpendingLevel(monthIncome, monthExpense);
        if (level.tier === 'juda_kop') {
          pushAlert(
            'danger',
            'Siz juda ko\'p xarajat qilib yuborayapsiz!',
            `${level.label} daraja (${level.ratioPercent}% sarflandi). ${level.advice}`
          );
        } else if (level.tier === 'kop') {
          pushAlert(
            'warning',
            'Xarajat darajasi «Ko\'p» bosqichiga chiqdi',
            `Daromadning ${level.ratioPercent}% qismi ishlatildi. Tejamkorlikka e'tibor bering.`
          );
        }
      }
    }

    const created: Transaction = {
      ...payload,
      id: `tx-${Date.now()}`,
    };
    setTransactions((prev) => [created, ...prev]);

    if (payload.type === 'transfer' && payload.linkedGoalId) {
      const targetGoal = goals.find((g) => g.id === payload.linkedGoalId);
      if (targetGoal) {
        setGoals((prev) =>
          prev.map((g) =>
            g.id === targetGoal.id
              ? {
                  ...g,
                  currentAmount: Math.min(
                    g.targetAmount,
                    g.currentAmount + payload.amount
                  ),
                }
              : g
          )
        );
        pushAlert(
          'success',
          'Maqsadga pul o\'tkazildi',
          `«${targetGoal.title}» jamg'armasiga +${formatMoney(
            payload.amount,
            currency
          )} o'tkazildi.`,
          targetGoal.id
        );
      }
    } else if (payload.type === 'transfer') {
      pushAlert(
        'insight',
        'Pul o\'tkazmasi bajarildi',
        `${payload.fromAccount || 'Hisob'} → ${
          payload.toAccount || 'Hisob'
        }: ${formatMoney(payload.amount, currency)}`
      );
    }
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  // Budget Handlers
  const handleUpdateBudget = (
    category: ExpenseCategory,
    newLimitUZS: number
  ) => {
    setBudgets((prev) =>
      prev.map((b) => (b.category === category ? { ...b, limit: newLimitUZS } : b))
    );
    pushAlert(
      'success',
      'Byudjet limiti yangilandi',
      `"${category}" uchun oylik limit ${formatMoney(newLimitUZS, currency)} etib belgilandi.`
    );
  };

  const handleApplyRecommendedBudgets = (nextBudgets: BudgetLimit[]) => {
    setBudgets(nextBudgets);
    pushAlert(
      'success',
      '50/30/20 byudjet rejasi qo\'llandi',
      'Oylik daromadingiz asosida barcha kategoriyalar muvozanatli qayta taqsimlandi.'
    );
  };

  // Goal Handlers
  const handleSaveGoal = (
    payload: Omit<FinancialGoal, 'id' | 'createdAt'>,
    existingId?: string
  ) => {
    if (existingId) {
      setGoals((prev) =>
        prev.map((g) => (g.id === existingId ? { ...g, ...payload } : g))
      );
      pushAlert(
        'success',
        'Maqsad yangilandi',
        `«${payload.title}» maqsadi parametrlari saqlandi.`
      );
    } else {
      const created: FinancialGoal = {
        ...payload,
        id: `goal-${Date.now()}`,
        createdAt: REFERENCE_DATE,
      };
      setGoals((prev) => [created, ...prev]);
      pushAlert(
        'insight',
        'Yangi moliyaviy maqsad yaratildi',
        `«${payload.title}» uchun oylik ${formatMoney(
          payload.monthlyContribution,
          currency
        )} sur'at bilan prognoz tuzildi.`,
        created.id
      );
    }
  };

  const handleDeleteGoal = (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  const handleContributeGoal = (goalId: string, amountUZS: number) => {
    const targetGoal = goals.find((g) => g.id === goalId);
    if (!targetGoal) return;
    setGoals((prev) =>
      prev.map((g) =>
        g.id === goalId
          ? {
              ...g,
              currentAmount: Math.min(g.targetAmount, g.currentAmount + amountUZS),
            }
          : g
      )
    );
    pushAlert(
      'success',
      'Jamg\'arma to\'ldirildi',
      `«${targetGoal.title}» maqsadiga +${formatMoney(
        amountUZS,
        currency
      )} qo'shildi.`,
      goalId
    );
  };

  const handleKeepSaving = (goal: FinancialGoal) => {
    pushAlert(
      'success',
      'Tejamkorlik saqlab qolindi',
      `Ajoyib qaror! «${goal.title}» uchun yig'ilgan ${formatMoney(
        goal.currentAmount,
        currency
      )} mablag' daxlsiz qoldi.`,
      goal.id
    );
  };

  const handleConfirmWithdraw = (
    goal: FinancialGoal,
    withdrawAmountUZS: number,
    recordAsExpense: boolean
  ) => {
    const isFull = withdrawAmountUZS >= goal.currentAmount;
    setGoals((prev) =>
      prev.map((g) =>
        g.id === goal.id
          ? { ...g, currentAmount: Math.max(0, g.currentAmount - withdrawAmountUZS) }
          : g
      )
    );

    if (recordAsExpense && withdrawAmountUZS > 0) {
      const tx: Transaction = {
        id: `tx-goal-${Date.now()}`,
        title: `Jamg'armadan foydalanish: ${goal.title}`,
        amount: withdrawAmountUZS,
        type: 'expense',
        category: 'Boshqa xarajat',
        date: REFERENCE_DATE,
        note: 'Moliyaviy maqsad jamg\'armasidan yechildi',
        linkedGoalId: goal.id,
      };
      setTransactions((prev) => [tx, ...prev]);
    }

    pushAlert(
      'danger',
      isFull
        ? 'Ogohlantirish: Jamg\'arma to\'liq ishlatildi!'
        : 'Ogohlantirish: Jamg\'armadan pul yechildi',
      `«${goal.title}» dan ${formatMoney(
        withdrawAmountUZS,
        currency
      )} sarflandi. Maqsadga erishish uchun tejash rejasini qayta tiklashingiz zarur!`,
      goal.id
    );
  };

  const handleCreateGoalFromSurvey = (
    payload: Omit<FinancialGoal, 'id' | 'createdAt'>
  ) => {
    handleSaveGoal(payload);
    setSurveyDismissed(true);
  };

  const handleResetDemo = () => {
    setTransactions(INITIAL_TRANSACTIONS);
    setBudgets(INITIAL_BUDGETS);
    setGoals(INITIAL_GOALS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setSurveyDismissed(false);
    pushAlert(
      'insight',
      'Ma\'lumotlar tiklandi',
      'Boshlang\'ich namuna ma\'lumotlari qayta yuklandi.'
    );
  };

  const navItems: {
    id: NavTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'overview', label: 'Umumiy ko\'rinish', icon: LayoutDashboard },
    { id: 'transactions', label: 'Tranzaksiyalar', icon: ListOrdered },
    { id: 'budgets', label: 'Byudjet reja', icon: PiggyBank },
    { id: 'goals', label: 'Moliyaviy maqsadlar', icon: Target },
    { id: 'analytics', label: 'Analitika', icon: BarChart3 },
    { id: 'settings', label: 'Parametrlar', icon: Settings },
  ];

  const activeLabel =
    navItems.find((n) => n.id === activeTab)?.label || 'Umumiy ko\'rinish';

  const profileInitials = userProfile.fullName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (isLocked) {
    return (
      <LoginScreen
        profile={userProfile}
        currency={currency}
        onUnlock={() => {
          setUserProfile((p) => ({ ...p, isRegistered: true }));
          setIsLocked(false);
        }}
        onCompleteRegistration={(data) => {
          setUserProfile((p) => ({
            ...p,
            fullName: data.fullName,
            email: data.email,
            role: data.role,
            pinCode: data.pinCode,
            pinEnabled: true,
            isRegistered: true,
          }));
          setCurrency(data.currency);
          setIsLocked(false);
          pushAlert(
            'success',
            'Xush kelibsiz!',
            `${data.fullName}, hisobingiz faollashtirildi. Keyingi kirishlar 4 xonali kodingiz bilan himoyalangan.`
          );
        }}
        onResetPinToDefault={() =>
          setUserProfile((p) => ({ ...p, pinCode: '2026' }))
        }
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <aside className="hidden w-64 shrink-0 flex-col justify-between border-r border-slate-200 bg-white lg:flex dark:border-slate-800 dark:bg-slate-900">
          <div>
            {/* Brand Wordmark */}
            <div className="flex h-16 items-center border-b border-slate-200 px-6 dark:border-slate-800">
              <a
                href="#overview"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('overview');
                }}
                className="font-display text-lg font-extrabold tracking-tight text-slate-900 whitespace-nowrap shrink-0 dark:text-white"
              >
                MoneyMind
              </a>
            </div>

            {/* Navigation Links */}
            <nav className="space-y-1 px-3 py-5" aria-label="Asosiy navigatsiya">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                      isActive
                        ? 'bg-slate-900 text-white dark:bg-teal-600 dark:text-white'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer Controls & Profile */}
          <div className="space-y-4 border-t border-slate-200 p-4 dark:border-slate-800">
            {/* Currency & Theme Quick Controls */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => setCurrency('UZS')}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                    currency === 'UZS'
                      ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                  }`}
                >
                  UZS
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency('USD')}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                    currency === 'USD'
                      ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                  }`}
                >
                  USD
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsDark((d) => !d)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  aria-label="Mavzuni almashtirish"
                  title="Yorug' / Qorong'i mavzu"
                >
                  {isDark ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleResetDemo}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  aria-label="Boshlang'ich holatga qaytarish"
                  title="Namuna ma'lumotlarni tiklash"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* User Profile */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-lg p-1 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60"
              >
                {!avatarError && userProfile.avatarUrl ? (
                  <img
                    src={userProfile.avatarUrl}
                    alt={userProfile.fullName}
                    referrerPolicy="no-referrer"
                    onError={() => setAvatarError(true)}
                    className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                  />
                ) : (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-700 text-xs font-bold text-white">
                    {profileInitials || 'MM'}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">
                    {userProfile.fullName}
                  </p>
                  <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                    {userProfile.role}
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIsLocked(true)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                aria-label="Hisobni qulflash"
                title="Hisobni qulflash (Login)"
              >
                <Lock className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile Drawer Navigation */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div
              className="fixed inset-0 bg-slate-950/50"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative flex w-64 flex-col justify-between bg-white p-4 shadow-xl dark:bg-slate-900">
              <div>
                <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
                  <span className="font-display text-lg font-extrabold text-slate-900 dark:text-white">
                    MoneyMind
                  </span>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <nav className="mt-4 space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setActiveTab(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium ${
                          isActive
                            ? 'bg-slate-900 text-white dark:bg-teal-600'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="flex items-center justify-between border-t border-slate-200 pt-4 dark:border-slate-800">
                <div className="flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
                  <button
                    type="button"
                    onClick={() => setCurrency('UZS')}
                    className={`rounded px-2.5 py-1 text-xs font-semibold ${
                      currency === 'UZS'
                        ? 'bg-white text-slate-900 dark:bg-slate-900 dark:text-white'
                        : 'text-slate-500'
                    }`}
                  >
                    UZS
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrency('USD')}
                    className={`rounded px-2.5 py-1 text-xs font-semibold ${
                      currency === 'USD'
                        ? 'bg-white text-slate-900 dark:bg-slate-900 dark:text-white'
                        : 'text-slate-500'
                    }`}
                  >
                    USD
                  </button>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsDark((d) => !d)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700"
                    aria-label="Mavzu"
                  >
                    {isDark ? (
                      <Sun className="h-4 w-4" />
                    ) : (
                      <Moon className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setIsLocked(true);
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700"
                    aria-label="Qulflash"
                  >
                    <Lock className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Workspace Content */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top Header Bar */}
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 backdrop-blur-xs sm:px-8 dark:border-slate-800 dark:bg-slate-900/95">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 lg:hidden dark:border-slate-700 dark:text-slate-300"
                aria-label="Menyu"
              >
                <Menu className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-2 truncate text-sm">
                <span className="font-medium text-slate-400 dark:text-slate-500">
                  MoneyMind
                </span>
                <span className="text-slate-300 dark:text-slate-700">/</span>
                <span className="truncate font-semibold text-slate-900 dark:text-white">
                  {activeLabel}
                </span>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setNotificationsOpen(true)}
                className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                aria-label="Bildirishnomalar"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="font-mono-num absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingTx(null);
                  setTxModalOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 whitespace-nowrap shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                Yangi operatsiya
              </button>
            </div>
          </header>

          {/* Viewport Container */}
          <main className="mx-auto w-full max-w-[1280px] flex-1 p-4 sm:p-8">
            {activeTab === 'overview' && (
              <OverviewView
                transactions={transactions}
                budgets={budgets}
                goals={goals}
                currency={currency}
                period={period}
                showSurveyBanner={!surveyDismissed}
                onCreateGoalFromSurvey={handleCreateGoalFromSurvey}
                onSkipSurvey={() => setSurveyDismissed(true)}
                onPeriodChange={setPeriod}
                onNavigate={setActiveTab}
                onAddTransaction={() => {
                  setEditingTx(null);
                  setTxModalOpen(true);
                }}
                onContributeGoal={(g) => setContributeGoal(g)}
                onWithdrawGoal={(g) => {
                  if (userProfile.goalGuardEnabled) {
                    setWithdrawGoal(g);
                  } else {
                    handleConfirmWithdraw(g, g.currentAmount, true);
                  }
                }}
              />
            )}

            {activeTab === 'transactions' && (
              <TransactionsView
                transactions={transactions}
                currency={currency}
                period={period}
                onPeriodChange={setPeriod}
                onAdd={() => {
                  setEditingTx(null);
                  setTxModalOpen(true);
                }}
                onEdit={(tx) => {
                  setEditingTx(tx);
                  setTxModalOpen(true);
                }}
                onDelete={handleDeleteTransaction}
              />
            )}

            {activeTab === 'budgets' && (
              <BudgetPlannerView
                transactions={transactions}
                budgets={budgets}
                currency={currency}
                onUpdateBudget={handleUpdateBudget}
                onApplyRecommendedBudgets={handleApplyRecommendedBudgets}
              />
            )}

            {activeTab === 'goals' && (
              <GoalsView
                goals={goals}
                transactions={transactions}
                currency={currency}
                onCreateGoal={() => {
                  setEditingGoal(null);
                  setGoalModalOpen(true);
                }}
                onOpenSurvey={() => {
                  setSurveyDismissed(false);
                  setActiveTab('overview');
                }}
                onEditGoal={(g) => {
                  setEditingGoal(g);
                  setGoalModalOpen(true);
                }}
                onDeleteGoal={handleDeleteGoal}
                onContributeGoal={(g) => setContributeGoal(g)}
                onWithdrawGoal={(g) => {
                  if (userProfile.goalGuardEnabled) {
                    setWithdrawGoal(g);
                  } else {
                    handleConfirmWithdraw(g, g.currentAmount, true);
                  }
                }}
              />
            )}

            {activeTab === 'analytics' && (
              <AnalyticsView transactions={transactions} currency={currency} />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                profile={userProfile}
                currency={currency}
                isDark={isDark}
                onUpdateProfile={setUserProfile}
                onCurrencyChange={setCurrency}
                onToggleTheme={() => setIsDark((d) => !d)}
                onLockApp={() => {
                  setUserProfile((p) => ({ ...p, isRegistered: true }));
                  setIsLocked(true);
                }}
                onSignOut={() => {
                  setUserProfile((p) => ({ ...p, isRegistered: false }));
                  setIsLocked(true);
                }}
                onExportJSON={() =>
                  exportAllDataJSON({
                    exportedAt: REFERENCE_DATE,
                    profile: userProfile,
                    transactions,
                    budgets,
                    goals,
                  })
                }
                onExportCSV={() => exportTransactionsCSV(transactions)}
                onResetDemoData={handleResetDemo}
                onNotify={(title, msg) => pushAlert('success', title, msg)}
              />
            )}
          </main>
        </div>
      </div>

      {/* Modals & Drawers */}
      <TransactionModal
        isOpen={txModalOpen}
        editingTx={editingTx}
        transactions={transactions}
        budgets={budgets}
        goals={goals}
        currency={currency}
        onClose={() => {
          setTxModalOpen(false);
          setEditingTx(null);
        }}
        onSave={handleSaveTransaction}
      />

      <GoalModal
        isOpen={goalModalOpen}
        editingGoal={editingGoal}
        currency={currency}
        actualMonthlyNetPace={actualMonthlyNetPace}
        onClose={() => {
          setGoalModalOpen(false);
          setEditingGoal(null);
        }}
        onSave={handleSaveGoal}
      />

      <GoalContributeModal
        goal={contributeGoal}
        currency={currency}
        onClose={() => setContributeGoal(null)}
        onContribute={handleContributeGoal}
      />

      <GoalWithdrawWarningModal
        goal={withdrawGoal}
        currency={currency}
        onClose={() => setWithdrawGoal(null)}
        onKeepSaving={handleKeepSaving}
        onConfirmWithdraw={handleConfirmWithdraw}
      />

      <NotificationsDrawer
        isOpen={notificationsOpen}
        notifications={notifications}
        onClose={() => setNotificationsOpen(false)}
        onMarkAllRead={() =>
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
        }
        onMarkRead={(id) =>
          setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
          )
        }
        onClearAll={() => setNotifications([])}
      />

      <ToastAlertStack
        toasts={toasts}
        onDismiss={(id) =>
          setToasts((prev) => prev.filter((t) => t.id !== id))
        }
      />
    </div>
  );
}
