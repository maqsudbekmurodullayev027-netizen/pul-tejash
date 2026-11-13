import React, { useMemo } from 'react';
import { CurrencyMode, Transaction } from '../types/finance';
import {
  CURRENT_MONTH_PREFIX,
  computeMonthlySeries,
  formatMoney,
} from '../utils/finance';
import { CashflowInteractiveChart } from './Charts';
import { SpendingLevelGauge } from './SpendingLevelGauge';

interface AnalyticsViewProps {
  transactions: Transaction[];
  currency: CurrencyMode;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  transactions,
  currency,
}) => {
  const monthlySeries = useMemo(
    () => computeMonthlySeries(transactions),
    [transactions]
  );

  const stats = useMemo(() => {
    const totalInc = monthlySeries.reduce((s, m) => s + m.income, 0);
    const totalExp = monthlySeries.reduce((s, m) => s + m.expense, 0);
    const avgInc =
      monthlySeries.length > 0 ? Math.round(totalInc / monthlySeries.length) : 0;
    const avgExp =
      monthlySeries.length > 0 ? Math.round(totalExp / monthlySeries.length) : 0;
    const avgNet = avgInc - avgExp;
    const avgSavingsRate =
      totalInc > 0 ? Math.round(((totalInc - totalExp) / totalInc) * 100) : 0;

    // Current month daily burn rate (13 days elapsed in November 2026)
    const novExpenses = transactions
      .filter(
        (t) => t.date.startsWith(CURRENT_MONTH_PREFIX) && t.type === 'expense'
      )
      .reduce((s, t) => s + t.amount, 0);
    const novIncome = transactions
      .filter(
        (t) => t.date.startsWith(CURRENT_MONTH_PREFIX) && t.type === 'income'
      )
      .reduce((s, t) => s + t.amount, 0);

    const daysElapsed = 13;
    const daysInMonth = 30;
    const dailyBurn = Math.round(novExpenses / daysElapsed);
    const projectedMonthExpense = dailyBurn * daysInMonth;
    const safeDailyLimit =
      novIncome > 0
        ? Math.round((novIncome * 0.75 - novExpenses) / (daysInMonth - daysElapsed))
        : 0;

    return {
      avgInc,
      avgExp,
      avgNet,
      avgSavingsRate,
      dailyBurn,
      projectedMonthExpense,
      safeDailyLimit: Math.max(0, safeDailyLimit),
      novIncome,
      novExpenses,
    };
  }, [monthlySeries, transactions]);

  const topExpenses = useMemo(() => {
    return [...transactions]
      .filter((t) => t.type === 'expense')
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);
  }, [transactions]);

  const incomeSources = useMemo(() => {
    const map = new Map<string, number>();
    let total = 0;
    for (const tx of transactions) {
      if (tx.type === 'income') {
        map.set(tx.category, (map.get(tx.category) || 0) + tx.amount);
        total += tx.amount;
      }
    }
    return Array.from(map.entries())
      .map(([name, amount]) => ({
        name,
        amount,
        percent: total > 0 ? Math.round((amount / total) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Chuqur moliyaviy analitika
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          O'rtacha oylik oqimlar, kunlik sarf tezligi va daromad manbalari tahlili
        </p>
      </div>

      {/* 5-Tier Spending Intensity Gauge for Current Month */}
      <SpendingLevelGauge
        income={stats.novIncome}
        expense={stats.novExpenses}
        currency={currency}
      />

      {/* Key Analytical Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            O'rtacha oylik daromad
          </span>
          <p className="font-mono-num mt-2 text-xl font-bold text-slate-900 dark:text-white">
            {formatMoney(stats.avgInc, currency)}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            6 oylik o'rtacha ko'rsatkich
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            O'rtacha oylik xarajat
          </span>
          <p className="font-mono-num mt-2 text-xl font-bold text-slate-900 dark:text-white">
            {formatMoney(stats.avgExp, currency)}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Jamg'arma koeffitsiyenti:{' '}
            <strong className="font-mono-num text-emerald-700 dark:text-emerald-400">
              {stats.avgSavingsRate}%
            </strong>
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Kunlik o'rtacha xarajat (Noyabr)
          </span>
          <p className="font-mono-num mt-2 text-xl font-bold text-slate-900 dark:text-white">
            {formatMoney(stats.dailyBurn, currency)} / kun
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Oy yakuni prognozi: {formatMoney(stats.projectedMonthExpense, currency, true)}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Xavfsiz kunlik xarajat limiti
          </span>
          <p className="font-mono-num mt-2 text-xl font-bold text-teal-700 dark:text-teal-400">
            {formatMoney(stats.safeDailyLimit, currency)} / kun
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            25% jamg'armani saqlab qolish uchun
          </p>
        </div>
      </div>

      {/* Full-width Monthly Cashflow & Savings Curve */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4">
          <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
            6 oylik daromad, xarajat va sof jamg'arma trendi
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Har bir oy ustiga sichqonchani olib borib aniq raqamlarni solishtiring
          </p>
        </div>
        <CashflowInteractiveChart
          data={monthlySeries}
          currency={currency}
          mode="line"
        />
      </div>

      {/* Bottom 2-column Breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
            Daromad manbalari diversifikatsiyasi
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Jami kirimlardagi har bir manba ulushi
          </p>

          <div className="mt-5 space-y-4">
            {incomeSources.map((src) => (
              <div key={src.name}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {src.name}
                  </span>
                  <span className="font-mono-num text-slate-600 dark:text-slate-300">
                    {formatMoney(src.amount, currency)} ·{' '}
                    <strong className="text-slate-900 dark:text-white">
                      {src.percent}%
                    </strong>
                  </span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-teal-600 dark:bg-teal-500"
                    style={{ width: `${src.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
            Eng yirik xarajatlar reytingi
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Tejamkorlikni oshirish uchun ko'rib chiqishga arziydigan chiqimlar
          </p>

          <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
            {topExpenses.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between gap-4 py-3 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900 dark:text-white">
                    {tx.title}
                  </p>
                  <p className="mt-0.5 text-slate-500 dark:text-slate-400">
                    {tx.category} · {tx.date}
                  </p>
                </div>
                <span className="font-mono-num shrink-0 font-bold text-slate-900 dark:text-white">
                  {formatMoney(tx.amount, currency)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
