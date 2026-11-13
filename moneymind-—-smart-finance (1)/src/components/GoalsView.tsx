import React, { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  Edit3,
  Plus,
  ShieldAlert,
  Target,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { CurrencyMode, FinancialGoal, Transaction } from '../types/finance';
import {
  calculateGoalProjection,
  computeAverageMonthlyNetSavings,
  formatMoney,
} from '../utils/finance';
import { GoalTrajectoryChart } from './Charts';

interface GoalsViewProps {
  goals: FinancialGoal[];
  transactions: Transaction[];
  currency: CurrencyMode;
  onCreateGoal: () => void;
  onOpenSurvey: () => void;
  onEditGoal: (goal: FinancialGoal) => void;
  onDeleteGoal: (id: string) => void;
  onContributeGoal: (goal: FinancialGoal) => void;
  onWithdrawGoal: (goal: FinancialGoal) => void;
}

export const GoalsView: React.FC<GoalsViewProps> = ({
  goals,
  transactions,
  currency,
  onCreateGoal,
  onOpenSurvey,
  onEditGoal,
  onDeleteGoal,
  onContributeGoal,
  onWithdrawGoal,
}) => {
  const [selectedGoalId, setSelectedGoalId] = useState<string>(
    goals[0]?.id || ''
  );
  const [simulatedPaceUZS, setSimulatedPaceUZS] = useState<number | null>(null);

  const actualMonthlyNetPace = useMemo(
    () => computeAverageMonthlyNetSavings(transactions),
    [transactions]
  );

  const selectedGoal = useMemo(
    () => goals.find((g) => g.id === selectedGoalId) || goals[0] || null,
    [goals, selectedGoalId]
  );

  useEffect(() => {
    if (selectedGoal) {
      setSimulatedPaceUZS(selectedGoal.monthlyContribution);
    }
  }, [selectedGoal?.id, selectedGoal?.monthlyContribution]);

  const totalSavedAcrossGoals = goals.reduce((s, g) => s + g.currentAmount, 0);
  const totalTargetAcrossGoals = goals.reduce((s, g) => s + g.targetAmount, 0);
  const totalMonthlyPlanned = goals.reduce(
    (s, g) => s + g.monthlyContribution,
    0
  );

  const selectedProjection = useMemo(() => {
    if (!selectedGoal) return null;
    return calculateGoalProjection(
      selectedGoal,
      actualMonthlyNetPace,
      currency,
      simulatedPaceUZS ?? selectedGoal.monthlyContribution
    );
  }, [selectedGoal, actualMonthlyNetPace, currency, simulatedPaceUZS]);

  const maxSliderValue = Math.max(
    10000000,
    (selectedGoal?.monthlyContribution || 2000000) * 3,
    actualMonthlyNetPace * 1.5
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Moliyaviy maqsadlar va yo'nalish prognozi
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Shu yurishda ketaversangiz qancha jamg'arilishi va jamg'arma himoyasi
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenSurvey}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap"
          >
            <Target className="h-3.5 w-3.5 text-teal-700 dark:text-teal-400" />
            So'rovnoma
          </button>
          <button
            type="button"
            onClick={onCreateGoal}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 whitespace-nowrap"
          >
            <Plus className="h-3.5 w-3.5" />
            Yangi maqsad qo'shish
          </button>
        </div>
      </div>

      {/* Top Pace Summary Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Maqsadlar uchun yig'ilgan summa
          </span>
          <p className="font-mono-num mt-2 text-xl font-bold text-slate-900 dark:text-white">
            {formatMoney(totalSavedAcrossGoals, currency)}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Umumiy maqsaddan{' '}
            <span className="font-mono-num font-semibold text-teal-700 dark:text-teal-400">
              {totalTargetAcrossGoals > 0
                ? Math.round(
                    (totalSavedAcrossGoals / totalTargetAcrossGoals) * 100
                  )
                : 0}
              %
            </span>
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            O'rtacha real sof jamg'arma sur'atingiz
          </span>
          <p className="font-mono-num mt-2 text-xl font-bold text-emerald-700 dark:text-emerald-400">
            {formatMoney(actualMonthlyNetPace, currency)} / oy
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            So'nggi 3 oylik daromad va xarajat farqi
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Rejadagi jami oylik ajratma
          </span>
          <p className="font-mono-num mt-2 text-xl font-bold text-slate-900 dark:text-white">
            {formatMoney(totalMonthlyPlanned, currency)} / oy
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {actualMonthlyNetPace >= totalMonthlyPlanned
              ? 'Daromadingiz barcha maqsadlarga yetarli'
              : 'Tejamkorlikni oshirish tavsiya etiladi'}
          </p>
        </div>
      </div>

      {goals.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center dark:border-slate-800 dark:bg-slate-900">
          <Target className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-700" />
          <h2 className="mt-3 text-base font-bold text-slate-900 dark:text-white">
            Hali moliyaviy maqsad yaratilmagan
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Nima uchun pul yig'ayotganingizni kiriting — tizim shu yurishda qachon
            yetishingizni hisoblab beradi.
          </p>
          <button
            type="button"
            onClick={onCreateGoal}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-800"
          >
            <Plus className="h-3.5 w-3.5" />
            Birinchi maqsadni qo'shish
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Goals List */}
          <div className="space-y-4 lg:col-span-5">
            {goals.map((goal) => {
              const proj = calculateGoalProjection(
                goal,
                actualMonthlyNetPace,
                currency
              );
              const isSelected = selectedGoal?.id === goal.id;
              return (
                <div
                  key={goal.id}
                  onClick={() => setSelectedGoalId(goal.id)}
                  className={`cursor-pointer rounded-xl border p-5 transition-colors ${
                    isSelected
                      ? 'border-teal-600 bg-white ring-1 ring-teal-600/20 dark:border-teal-500 dark:bg-slate-900'
                      : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
                        {goal.title}
                      </h3>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {goal.category} · Maqsad muddati: {goal.targetDate}
                      </p>
                    </div>
                    <div
                      className="flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => onEditGoal(goal)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-white"
                        aria-label="Tahrirlash"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteGoal(goal.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                        aria-label="O'chirish"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex items-baseline justify-between gap-2 tabular-nums">
                    <span className="font-mono-num text-lg font-bold text-slate-900 dark:text-white">
                      {formatMoney(goal.currentAmount, currency)}
                    </span>
                    <span className="font-mono-num text-xs text-slate-500 dark:text-slate-400">
                      Maqsad: {formatMoney(goal.targetAmount, currency)}
                    </span>
                  </div>

                  <div className="mt-2.5 flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-teal-600 transition-all duration-200 dark:bg-teal-500"
                        style={{ width: `${proj.progressPercent}%` }}
                      />
                    </div>
                    <span className="font-mono-num text-xs font-bold text-teal-700 dark:text-teal-400">
                      {proj.progressPercent}%
                    </span>
                  </div>

                  <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    {proj.paceVerdict}
                  </p>

                  <div
                    className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3.5 dark:border-slate-800"
                    onClick={(e) => e.stopPropagation()}
                  >
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
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:border-red-900 dark:hover:bg-red-950/40 dark:hover:text-red-400 whitespace-nowrap"
                    >
                      <ShieldAlert className="h-3.5 w-3.5" />
                      Puldan foydalanish
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive Pace Simulator & Trajectory Chart */}
          {selectedGoal && selectedProjection && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-7 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
                <div>
                  <span className="text-xs font-medium text-teal-700 dark:text-teal-400">
                    Interaktiv sur'at simulyatori
                  </span>
                  <h2 className="font-display mt-0.5 text-lg font-bold text-slate-900 dark:text-white">
                    {selectedGoal.title} — Yo'nalish prognozi
                  </h2>
                </div>
                <div className="text-right text-xs text-slate-500 dark:text-slate-400">
                  <span>Qolgan summa</span>
                  <p className="font-mono-num mt-0.5 text-sm font-bold text-slate-900 dark:text-white">
                    {formatMoney(selectedProjection.remainingAmount, currency)}
                  </p>
                </div>
              </div>

              {/* Slider control */}
              <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <label
                    htmlFor="pace-slider"
                    className="font-semibold text-slate-700 dark:text-slate-200"
                  >
                    Oylik ajratma sur'ati («Shu yurishda ketaversa»):
                  </label>
                  <span className="font-mono-num text-sm font-bold text-teal-700 dark:text-teal-400">
                    {formatMoney(
                      simulatedPaceUZS ?? selectedGoal.monthlyContribution,
                      currency
                    )}{' '}
                    / oy
                  </span>
                </div>

                <input
                  id="pace-slider"
                  type="range"
                  min={200000}
                  max={Math.round(maxSliderValue)}
                  step={100000}
                  value={simulatedPaceUZS ?? selectedGoal.monthlyContribution}
                  onChange={(e) => setSimulatedPaceUZS(Number(e.target.value))}
                  className="mt-3 h-2 w-full cursor-pointer accent-teal-700 dark:accent-teal-500"
                />

                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>{formatMoney(200000, currency, true)}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setSimulatedPaceUZS(selectedGoal.monthlyContribution)
                    }
                    className="font-medium text-teal-700 hover:underline dark:text-teal-400"
                  >
                    Reja sur'atiga qaytarish (
                    {formatMoney(selectedGoal.monthlyContribution, currency, true)})
                  </button>
                  <span>{formatMoney(maxSliderValue, currency, true)}</span>
                </div>
              </div>

              {/* Forecast Verdict */}
              <div className="mt-5 rounded-lg border border-teal-200 bg-teal-50/70 p-4 text-xs text-teal-950 dark:border-teal-900/60 dark:bg-teal-950/30 dark:text-teal-100">
                <div className="flex items-start gap-2.5">
                  <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-teal-700 dark:text-teal-400" />
                  <div className="space-y-1">
                    <p className="font-semibold">
                      {selectedProjection.paceVerdict}
                    </p>
                    {selectedProjection.paceComparisonNote && (
                      <p className="opacity-90">
                        {selectedProjection.paceComparisonNote}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* 3 / 6 / 12 month milestone strip */}
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-slate-200 p-3.5 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    3 oydan keyin
                  </span>
                  <p className="font-mono-num mt-1 text-sm font-bold text-slate-900 dark:text-white">
                    {formatMoney(selectedProjection.amountIn3Months, currency)}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 p-3.5 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    6 oydan keyin
                  </span>
                  <p className="font-mono-num mt-1 text-sm font-bold text-slate-900 dark:text-white">
                    {formatMoney(selectedProjection.amountIn6Months, currency)}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 p-3.5 dark:border-slate-800">
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                    <Calendar className="h-3 w-3" />
                    <span>Taxminiy yakun</span>
                  </div>
                  <p className="mt-1 text-sm font-bold text-teal-700 dark:text-teal-400">
                    {selectedProjection.projectedDatePlanned}
                  </p>
                </div>
              </div>

              {/* Trajectory Chart */}
              <div className="mt-6">
                <GoalTrajectoryChart
                  currentAmount={selectedGoal.currentAmount}
                  targetAmount={selectedGoal.targetAmount}
                  plannedMonthly={selectedGoal.monthlyContribution}
                  simulatedMonthly={
                    simulatedPaceUZS ?? selectedGoal.monthlyContribution
                  }
                  currency={currency}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
