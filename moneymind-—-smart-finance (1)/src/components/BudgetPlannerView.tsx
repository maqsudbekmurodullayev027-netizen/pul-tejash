import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Edit3,
  ShieldAlert,
  SlidersHorizontal,
} from 'lucide-react';
import {
  BudgetLimit,
  CurrencyMode,
  ExpenseCategory,
  Transaction,
} from '../types/finance';
import { CATEGORY_COLORS } from '../data/seedData';
import {
  CURRENT_MONTH_PREFIX,
  USD_RATE,
  formatMoney,
} from '../utils/finance';

interface BudgetPlannerViewProps {
  transactions: Transaction[];
  budgets: BudgetLimit[];
  currency: CurrencyMode;
  onUpdateBudget: (category: ExpenseCategory, newLimitUZS: number) => void;
  onApplyRecommendedBudgets: (newBudgets: BudgetLimit[]) => void;
}

export const BudgetPlannerView: React.FC<BudgetPlannerViewProps> = ({
  transactions,
  budgets,
  currency,
  onUpdateBudget,
  onApplyRecommendedBudgets,
}) => {
  const [editingCat, setEditingCat] = useState<ExpenseCategory | null>(null);
  const [editValue, setEditValue] = useState('');

  const currentMonthTx = useMemo(
    () => transactions.filter((t) => t.date.startsWith(CURRENT_MONTH_PREFIX)),
    [transactions]
  );

  const monthIncome = useMemo(
    () =>
      currentMonthTx
        .filter((t) => t.type === 'income')
        .reduce((s, t) => s + t.amount, 0),
    [currentMonthTx]
  );

  const budgetRows = useMemo(() => {
    return budgets.map((b) => {
      const spent = currentMonthTx
        .filter((t) => t.type === 'expense' && t.category === b.category)
        .reduce((s, t) => s + t.amount, 0);
      const remaining = b.limit - spent;
      const percent = b.limit > 0 ? Math.round((spent / b.limit) * 100) : 0;
      const status: 'normal' | 'warning' | 'over' =
        percent > 100 ? 'over' : percent >= 80 ? 'warning' : 'normal';
      return { ...b, spent, remaining, percent, status };
    });
  }, [budgets, currentMonthTx]);

  const totalBudgeted = budgetRows.reduce((s, b) => s + b.limit, 0);
  const totalSpent = budgetRows.reduce((s, b) => s + b.spent, 0);
  const overallPercent =
    totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0;
  const warningCount = budgetRows.filter((b) => b.status !== 'normal').length;

  const startEdit = (cat: ExpenseCategory, currentLimitUZS: number) => {
    setEditingCat(cat);
    setEditValue(
      currency === 'USD'
        ? String(Math.round(currentLimitUZS / USD_RATE))
        : String(currentLimitUZS)
    );
  };

  const commitEdit = (cat: ExpenseCategory) => {
    const parsed = parseFloat(editValue);
    if (Number.isFinite(parsed) && parsed >= 0) {
      const newUZS =
        currency === 'USD' ? Math.round(parsed * USD_RATE) : Math.round(parsed);
      onUpdateBudget(cat, newUZS);
    }
    setEditingCat(null);
  };

  // Smart 50/30/20 allocator based on current monthly income
  const applySmart503020 = () => {
    const baseIncome = Math.max(monthIncome, 15000000);
    // 50% needs + 30% wants = 80% total expense budget, 20% reserved strictly for savings
    const needsPool = Math.round(baseIncome * 0.52);
    const wantsPool = Math.round(baseIncome * 0.28);

    const next: BudgetLimit[] = [
      { category: 'Uy-joy va kommunal', limit: Math.round(needsPool * 0.44) },
      { category: 'Oziq-ovqat', limit: Math.round(needsPool * 0.36) },
      { category: 'Transport', limit: Math.round(needsPool * 0.12) },
      { category: 'Sog\'liq', limit: Math.round(needsPool * 0.08) },
      { category: 'Ta\'lim va rivojlanish', limit: Math.round(wantsPool * 0.36) },
      { category: 'Ko\'ngilochar', limit: Math.round(wantsPool * 0.26) },
      { category: 'Texnika va xaridlar', limit: Math.round(wantsPool * 0.24) },
      { category: 'Boshqa xarajat', limit: Math.round(wantsPool * 0.14) },
    ];
    onApplyRecommendedBudgets(next);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Byudjet rejalashtiruvchi (Noyabr 2026)
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Har bir kategoriya uchun oylik limitlarni belgilang va ortiqcha sarfni oldini oling
          </p>
        </div>

        <button
          type="button"
          onClick={applySmart503020}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap"
        >
          <SlidersHorizontal className="h-3.5 w-3.5 text-teal-700 dark:text-teal-400" />
          50/30/20 qoidasi bo'yicha taqsimlash
        </button>
      </div>

      {/* Summary Bar */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Jami oylik byudjet limiti
          </span>
          <p className="font-mono-num mt-2 text-xl font-bold text-slate-900 dark:text-white">
            {formatMoney(totalBudgeted, currency)}
          </p>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            Joriy daromadning{' '}
            <span className="font-mono-num font-semibold text-slate-900 dark:text-white">
              {monthIncome > 0 ? Math.round((totalBudgeted / monthIncome) * 100) : 0}%
            </span>{' '}
            qismi
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Hozirgacha sarflandi
          </span>
          <p className="font-mono-num mt-2 text-xl font-bold text-slate-900 dark:text-white">
            {formatMoney(totalSpent, currency)}
          </p>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            Umumiy limitdan{' '}
            <span className="font-mono-num font-semibold">{overallPercent}%</span>
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Qolgan xavfsiz limit
          </span>
          <p
            className={`font-mono-num mt-2 text-xl font-bold ${
              totalBudgeted - totalSpent >= 0
                ? 'text-emerald-700 dark:text-emerald-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {formatMoney(totalBudgeted - totalSpent, currency)}
          </p>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            Oy yakunigacha qolgan zahira
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Nazorat holati
          </span>
          <p className="font-mono-num mt-2 text-xl font-bold text-slate-900 dark:text-white">
            {warningCount === 0 ? 'Barqaror' : `${warningCount} ta ogohlantirish`}
          </p>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            80% dan oshgan kategoriyalar avtomatik belgilanadi
          </p>
        </div>
      </div>

      {/* Category Budget Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {budgetRows.map((row) => {
          const isEditing = editingCat === row.category;
          const barColor =
            row.status === 'over'
              ? 'bg-red-600 dark:bg-red-500'
              : row.status === 'warning'
              ? 'bg-amber-500 dark:bg-amber-400'
              : 'bg-teal-600 dark:bg-teal-500';

          return (
            <div
              key={row.category}
              className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span
                    className="h-3 w-3 shrink-0 rounded-xs"
                    style={{ backgroundColor: CATEGORY_COLORS[row.category] }}
                  />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {row.category}
                    </h3>
                    <div className="mt-0.5 flex items-center gap-1.5 text-xs">
                      {row.status === 'over' ? (
                        <span className="inline-flex items-center gap-1 font-medium text-red-600 dark:text-red-400">
                          <ShieldAlert className="h-3.5 w-3.5" />
                          Limit oshdi · {row.percent}%
                        </span>
                      ) : row.status === 'warning' ? (
                        <span className="inline-flex items-center gap-1 font-medium text-amber-700 dark:text-amber-400">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Chegaraga yaqin · {row.percent}%
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Me'yorda · {row.percent}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {isEditing ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitEdit(row.category);
                        if (e.key === 'Escape') setEditingCat(null);
                      }}
                      className="font-mono-num w-28 rounded-lg border border-teal-600 bg-white px-2.5 py-1 text-xs text-slate-900 outline-none dark:bg-slate-950 dark:text-white"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => commitEdit(row.category)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-700 text-white hover:bg-teal-800"
                      aria-label="Saqlash"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => startEdit(row.category, row.limit)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 whitespace-nowrap"
                  >
                    <Edit3 className="h-3 w-3" />
                    Limitni o'zgartirish
                  </button>
                )}
              </div>

              <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-200 ${barColor}`}
                  style={{ width: `${Math.min(100, row.percent)}%` }}
                />
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs tabular-nums">
                <span className="text-slate-600 dark:text-slate-300">
                  Sarflandi:{' '}
                  <strong className="font-mono-num text-slate-900 dark:text-white">
                    {formatMoney(row.spent, currency)}
                  </strong>
                </span>
                <span className="text-slate-600 dark:text-slate-300">
                  Limit:{' '}
                  <strong className="font-mono-num text-slate-900 dark:text-white">
                    {formatMoney(row.limit, currency)}
                  </strong>
                </span>
                <span
                  className={`font-mono-num font-semibold ${
                    row.remaining >= 0
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {row.remaining >= 0
                    ? `Qoldi: ${formatMoney(row.remaining, currency)}`
                    : `Oshdi: ${formatMoney(Math.abs(row.remaining), currency)}`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
