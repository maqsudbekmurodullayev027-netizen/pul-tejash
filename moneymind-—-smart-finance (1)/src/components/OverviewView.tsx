import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  HelpCircle,
  Plus,
  ShieldAlert,
  TrendingUp,
} from 'lucide-react';
import {
  BudgetLimit,
  CurrencyMode,
  ExpenseCategory,
  FinancialGoal,
  NavTab,
  PeriodFilter,
  Transaction,
} from '../types/finance';
import {
  CURRENT_MONTH_PREFIX,
  calculateGoalProjection,
  computeAverageMonthlyNetSavings,
  computeMonthlySeries,
  filterTransactionsByPeriod,
  formatMoney,
  formatUzDate,
} from '../utils/finance';
import { CashflowInteractiveChart, CategoryDonutChart } from './Charts';
import { GoalSurveyBanner } from './GoalSurveyBanner';
import { SpendingLevelGauge } from './SpendingLevelGauge';

interface OverviewViewProps {
  transactions: Transaction[];
  budgets: BudgetLimit[];
  goals: FinancialGoal[];
  currency: CurrencyMode;
  period: PeriodFilter;
  showSurveyBanner: boolean;
  onCreateGoalFromSurvey: (goal: Omit<FinancialGoal, 'id' | 'createdAt'>) => void;
  onSkipSurvey: () => void;
  onPeriodChange: (p: PeriodFilter) => void;
  onNavigate: (tab: NavTab) => void;
  onAddTransaction: () => void;
  onContributeGoal: (goal: FinancialGoal) => void;
  onWithdrawGoal: (goal: FinancialGoal) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  transactions,
  budgets,
  goals,
  currency,
  period,
  showSurveyBanner,
  onCreateGoalFromSurvey,
  onSkipSurvey,
  onPeriodChange,
  onNavigate,
  onAddTransaction,
  onContributeGoal,
  onWithdrawGoal,
}) => {
  const [chartMode, setChartMode] = useState<'bars' | 'line'>('bars');
  const [showGuide, setShowGuide] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | null>(
    null
  );

  const periodTx = useMemo(
    () => filterTransactionsByPeriod(transactions, period),
    [transactions, period]
  );

  const totalBalance = useMemo(() => {
    return transactions.reduce((sum, t) => {
      if (t.type === 'income') return sum + t.amount;
      if (t.type === 'expense') return sum - t.amount;
      // P2P outgoing transfers reduce liquid cash; internal/goal transfers preserve net worth
      if (t.type === 'transfer' && t.toAccount?.includes('P2P')) {
        return sum - t.amount;
      }
      return sum;
    }, 0);
  }, [transactions]);

  const totalGoalsSaved = useMemo(
    () => goals.reduce((s, g) => s + g.currentAmount, 0),
    [goals]
  );

  const periodIncome = useMemo(
    () =>
      periodTx
        .filter((t) => t.type === 'income')
        .reduce((s, t) => s + t.amount, 0),
    [periodTx]
  );

  const periodExpense = useMemo(
    () =>
      periodTx
        .filter((t) => t.type === 'expense')
        .reduce((s, t) => s + t.amount, 0),
    [periodTx]
  );

  const periodNet = periodIncome - periodExpense;
  const savingsRate =
    periodIncome > 0 ? Math.round((periodNet / periodIncome) * 100) : 0;

  const monthlySeries = useMemo(
    () => computeMonthlySeries(transactions),
    [transactions]
  );

  const actualMonthlyNetPace = useMemo(
    () => computeAverageMonthlyNetSavings(transactions),
    [transactions]
  );

  const categoryBreakdown = useMemo(() => {
    const map = new Map<ExpenseCategory, number>();
    const expenses = periodTx.filter((t) => t.type === 'expense');
    for (const tx of expenses) {
      const cat = tx.category as ExpenseCategory;
      map.set(cat, (map.get(cat) || 0) + tx.amount);
    }
    const items = Array.from(map.entries())
      .map(([category, amount]) => ({
        category,
        amount,
        percent:
          periodExpense > 0 ? Math.round((amount / periodExpense) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
    return items;
  }, [periodTx, periodExpense]);

  const currentMonthBudgetAlerts = useMemo(() => {
    const monthExpenses = transactions.filter(
      (t) => t.date.startsWith(CURRENT_MONTH_PREFIX) && t.type === 'expense'
    );
    return budgets
      .map((b) => {
        const spent = monthExpenses
          .filter((t) => t.category === b.category)
          .reduce((s, t) => s + t.amount, 0);
        const pct = b.limit > 0 ? Math.round((spent / b.limit) * 100) : 0;
        return { ...b, spent, pct };
      })
      .filter((b) => b.pct >= 80)
      .sort((a, b) => b.pct - a.pct);
  }, [transactions, budgets]);

  const recentTransactions = useMemo(() => {
    const base = selectedCategory
      ? periodTx.filter((t) => t.category === selectedCategory)
      : periodTx;
    return [...base]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 6);
  }, [periodTx, selectedCategory]);

  const periodLabels: { key: PeriodFilter; label: string }[] = [
    { key: 'this_month', label: 'Bu oy' },
    { key: 'last_month', label: 'O\'tgan oy' },
    { key: '3_months', label: '3 oy' },
    { key: '6_months', label: '6 oy' },
    { key: 'all', label: 'Barchasi' },
  ];

  return (
    <div className="space-y-6">
      {/* Workspace Filter Strip */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Moliyaviy umumiy ko'rinish
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Kirim, chiqim, pul o'tkazmalari va jamg'arma maqsadlaringiz holati
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowGuide((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 whitespace-nowrap"
          >
            <HelpCircle className="h-3.5 w-3.5 text-teal-700 dark:text-teal-400" />
            Kirim va chiqim tushuntirishi
          </button>

          <div className="flex flex-wrap items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
            {periodLabels.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => onPeriodChange(p.key)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  period === p.key
                    ? 'bg-slate-900 text-white dark:bg-teal-600 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Skippable "Pulni nimaga yig'moqchisiz?" Survey */}
      {showSurveyBanner && (
        <GoalSurveyBanner
          currency={currency}
          actualMonthlyNetPace={actualMonthlyNetPace}
          onCreateGoalFromSurvey={onCreateGoalFromSurvey}
          onSkip={onSkipSurvey}
        />
      )}

      {/* Clear Kirim / Chiqim / O'tkazma Guide Panel */}
      {showGuide && (
        <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-5 md:grid-cols-3 dark:border-slate-800 dark:bg-slate-900">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400">
              <ArrowDownLeft className="h-4 w-4" />
              <span>Kirim (Daromad) nima?</span>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              Sizga kelib tushgan barcha pullar: oylik maosh, frilans to'lovlar,
              investitsiya foydasi yoki sovg'a. Kirimlar umumiy balansingizni
              oshiradi va jamg'arma sur'atingizni tezlashtiradi.
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
              <ArrowUpRight className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              <span>Chiqim (Xarajat) nima?</span>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              Do'kon, ijara, transport, ta'lim va boshqa ehtiyojlar uchun sarflangan
              mablag'lar. Chiqimlar balansni kamaytiradi va kategoriya bo'yicha
              byudjet limitidan ayiriladi.
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-teal-700 dark:text-teal-400">
              <ArrowLeftRight className="h-4 w-4" />
              <span>Pul o'tkazmasi nima?</span>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              Bir kartadan ikkinchi kartaga, naqd hamyonga yoki moliyaviy maqsad
              jamg'armasiga pul ko'chirish. Ichki o'tkazmalar umumiy boyligingizni
              kamaytirmaydi, faqat pul qayerda turganini ko'rsatadi.
            </p>
          </div>
        </div>
      )}

      {/* 4-Column KPI Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Umumiy sof balans</span>
            <span className="font-mono-num">6 oylik qoldiq</span>
          </div>
          <p className="font-mono-num mt-2.5 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {formatMoney(totalBalance, currency)}
          </p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Maqsadlar jamg'armasi:{' '}
            <span className="font-mono-num font-semibold text-teal-700 dark:text-teal-400">
              {formatMoney(totalGoalsSaved, currency, true)}
            </span>
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Davr daromadi</span>
            <ArrowDownLeft className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="font-mono-num mt-2.5 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {formatMoney(periodIncome, currency)}
          </p>
          <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-400">
            {periodTx.filter((t) => t.type === 'income').length} ta kirim operatsiyasi
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Davr xarajati</span>
            <ArrowUpRight className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          </div>
          <p className="font-mono-num mt-2.5 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {formatMoney(periodExpense, currency)}
          </p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {periodTx.filter((t) => t.type === 'expense').length} ta chiqim operatsiyasi
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Sof jamg'arma sur'ati</span>
            <TrendingUp className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          </div>
          <p
            className={`font-mono-num mt-2.5 text-2xl font-bold tracking-tight ${
              periodNet >= 0
                ? 'text-emerald-700 dark:text-emerald-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {periodNet >= 0 ? '+' : ''}
            {formatMoney(periodNet, currency)}
          </p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Daromaddan tejalgan ulush:{' '}
            <span className="font-mono-num font-semibold text-slate-900 dark:text-white">
              {savingsRate}%
            </span>
          </p>
        </div>
      </div>

      {/* 5-Tier Spending Intensity Gauge (A'lo / Yaxshi / Normal / Ko'p / Juda ko'p) */}
      <SpendingLevelGauge
        income={periodIncome}
        expense={periodExpense}
        currency={currency}
      />

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-8 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                Daromad va xarajatlar dinamikasi
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Oylik pul oqimi va sof jamg'arma traektoriyasi
              </p>
            </div>
            <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setChartMode('bars')}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                  chartMode === 'bars'
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                Ustunli
              </button>
              <button
                type="button"
                onClick={() => setChartMode('line')}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                  chartMode === 'line'
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                Chiziqli
              </button>
            </div>
          </div>

          <CashflowInteractiveChart
            data={monthlySeries}
            currency={currency}
            mode={chartMode}
          />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                Xarajatlar tarkibi
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {selectedCategory
                  ? `Filtr: ${selectedCategory}`
                  : 'Kategoriyani bosib filtrlashingiz mumkin'}
              </p>
            </div>
            {selectedCategory && (
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className="text-xs font-medium text-teal-700 hover:underline dark:text-teal-400 whitespace-nowrap"
              >
                Tozalash
              </button>
            )}
          </div>

          <CategoryDonutChart
            items={categoryBreakdown}
            totalExpense={periodExpense}
            currency={currency}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </div>
      </div>

      {/* Bottom Split: Goals Pace Projections + Recent Transactions & Budget Watch */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Financial Goals & Pace Projection Summary */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                Moliyaviy maqsadlar va sur'at prognozi
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Shu yurishda ketaversangiz qachon va qancha yig'ilishi hisobi
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('goals')}
              className="text-xs font-semibold text-teal-700 hover:underline dark:text-teal-400 whitespace-nowrap"
            >
              Barchasi →
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {goals.slice(0, 3).map((goal) => {
              const proj = calculateGoalProjection(
                goal,
                actualMonthlyNetPace,
                currency
              );
              return (
                <div key={goal.id} className="py-4 first:pt-1 last:pb-0">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {goal.title}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {goal.category} · Oylik reja:{' '}
                        <span className="font-mono-num">
                          {formatMoney(goal.monthlyContribution, currency)}
                        </span>
                      </p>
                    </div>
                    <div className="text-right tabular-nums">
                      <span className="font-mono-num text-sm font-bold text-slate-900 dark:text-white">
                        {formatMoney(goal.currentAmount, currency, true)}
                      </span>
                      <span className="font-mono-num text-xs text-slate-500 dark:text-slate-400">
                        {' '}
                        / {formatMoney(goal.targetAmount, currency, true)}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-2.5 flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-teal-600 transition-all duration-200 dark:bg-teal-500"
                        style={{ width: `${proj.progressPercent}%` }}
                      />
                    </div>
                    <span className="font-mono-num text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {proj.progressPercent}%
                    </span>
                  </div>

                  <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    {proj.paceVerdict}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onContributeGoal(goal)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-slate-800 dark:bg-teal-600 dark:hover:bg-teal-500 whitespace-nowrap"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Pul qo'shish
                    </button>
                    <button
                      type="button"
                      disabled={goal.currentAmount <= 0}
                      onClick={() => onWithdrawGoal(goal)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:border-red-800 dark:hover:bg-red-950/40 dark:hover:text-red-400 whitespace-nowrap"
                    >
                      <ShieldAlert className="h-3.5 w-3.5" />
                      Puldan foydalanish
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Budget Warnings + Recent Transactions */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-6 dark:border-slate-800 dark:bg-slate-900">
          {currentMonthBudgetAlerts.length > 0 && (
            <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50/80 p-3.5 dark:border-amber-900/50 dark:bg-amber-950/30">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <div className="text-xs">
                    <p className="font-semibold text-amber-950 dark:text-amber-100">
                      Byudjet nazorati ({currentMonthBudgetAlerts.length} ta kategoriya chegarada)
                    </p>
                    <p className="mt-0.5 text-amber-900/90 dark:text-amber-200/90">
                      {currentMonthBudgetAlerts[0].category}:{' '}
                      <span className="font-mono-num font-semibold">
                        {currentMonthBudgetAlerts[0].pct}%
                      </span>{' '}
                      ishlatildi (
                      {formatMoney(currentMonthBudgetAlerts[0].spent, currency, true)} /{' '}
                      {formatMoney(currentMonthBudgetAlerts[0].limit, currency, true)})
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('budgets')}
                  className="shrink-0 text-xs font-semibold text-amber-900 underline dark:text-amber-300 whitespace-nowrap"
                >
                  Tekshirish
                </button>
              </div>
            </div>
          )}

          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                So'nggi operatsiyalar
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {selectedCategory
                  ? `"${selectedCategory}" bo'yicha operatsiyalar`
                  : 'Kirim va chiqimlar tarixi'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('transactions')}
              className="text-xs font-semibold text-teal-700 hover:underline dark:text-teal-400 whitespace-nowrap"
            >
              To'liq ro'yxat →
            </button>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Tanlangan filtr bo'yicha operatsiyalar topilmadi.
              </p>
              <button
                type="button"
                onClick={onAddTransaction}
                className="mt-3 rounded-lg bg-teal-700 px-4 py-2 text-xs font-medium text-white hover:bg-teal-800"
              >
                Operatsiya qo'shish
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between gap-4 py-3 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-900 dark:text-white">
                      {tx.title}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {tx.type === 'transfer' && tx.fromAccount && tx.toAccount
                        ? `${tx.fromAccount} → ${tx.toAccount}`
                        : tx.category}{' '}
                      · {formatUzDate(tx.date)}
                    </p>
                  </div>
                  <span
                    className={`font-mono-num shrink-0 font-semibold ${
                      tx.type === 'income'
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : tx.type === 'transfer'
                        ? 'text-teal-700 dark:text-teal-400'
                        : 'text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : tx.type === 'transfer' ? '⇄ ' : '-'}
                    {formatMoney(tx.amount, currency)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
