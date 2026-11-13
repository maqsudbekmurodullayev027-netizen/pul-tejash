import React, { useMemo, useState } from 'react';
import { ArrowRight, Target, X } from 'lucide-react';
import { CurrencyMode, FinancialGoal } from '../types/finance';
import { USD_RATE, calculateGoalProjection, formatMoney } from '../utils/finance';

interface GoalSurveyBannerProps {
  currency: CurrencyMode;
  actualMonthlyNetPace: number;
  onCreateGoalFromSurvey: (
    goal: Omit<FinancialGoal, 'id' | 'createdAt'>
  ) => void;
  onSkip: () => void;
}

const PRESET_GOALS = [
  { label: 'Uy-joy / Kvartira', category: 'Ko\'chmas mulk', targetUZS: 120000000 },
  { label: 'Avtomobil', category: 'Transport', targetUZS: 80000000 },
  { label: 'Texnika / Noutbuk', category: 'Texnika va karyera', targetUZS: 20000000 },
  { label: 'Sayohat / Ta\'til', category: 'Sayohat', targetUZS: 18000000 },
  { label: 'Ta\'lim / Kurslar', category: 'Ta\'lim', targetUZS: 12000000 },
  { label: 'Xavfsizlik zaxirasi', category: 'Moliyaviy xavfsizlik', targetUZS: 35000000 },
];

export const GoalSurveyBanner: React.FC<GoalSurveyBannerProps> = ({
  currency,
  actualMonthlyNetPace,
  onCreateGoalFromSurvey,
  onSkip,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('Uy-joy / Kvartira');
  const [customTitle, setCustomTitle] = useState('');
  const [targetInput, setTargetInput] = useState(
    currency === 'USD' ? '9000' : '120000000'
  );
  const [monthlyInput, setMonthlyInput] = useState(
    currency === 'USD' ? '300' : '3500000'
  );
  const [isCustom, setIsCustom] = useState(false);

  const handleSelectPreset = (preset: (typeof PRESET_GOALS)[number]) => {
    setIsCustom(false);
    setSelectedPreset(preset.label);
    setTargetInput(
      currency === 'USD'
        ? String(Math.round(preset.targetUZS / USD_RATE))
        : String(preset.targetUZS)
    );
  };

  const toUZS = (val: string) => {
    const n = parseFloat(val);
    if (!Number.isFinite(n) || n <= 0) return 0;
    return currency === 'USD' ? Math.round(n * USD_RATE) : Math.round(n);
  };

  const goalTitle = isCustom
    ? customTitle.trim() || 'Shaxsiy maqsad'
    : selectedPreset;
  const targetUZS = Math.max(100000, toUZS(targetInput));
  const monthlyUZS = Math.max(0, toUZS(monthlyInput));

  const projection = useMemo(() => {
    const mockGoal: FinancialGoal = {
      id: 'survey-preview',
      title: goalTitle,
      category: 'So\'rovnoma',
      targetAmount: targetUZS,
      currentAmount: 0,
      monthlyContribution: monthlyUZS,
      targetDate: '2027-12',
      createdAt: '2026-11-13',
    };
    return calculateGoalProjection(mockGoal, actualMonthlyNetPace, currency);
  }, [goalTitle, targetUZS, monthlyUZS, actualMonthlyNetPace, currency]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const matchedPreset = PRESET_GOALS.find((p) => p.label === selectedPreset);
    onCreateGoalFromSurvey({
      title: goalTitle,
      category: isCustom
        ? 'Shaxsiy maqsad'
        : matchedPreset?.category || 'Shaxsiy maqsad',
      targetAmount: targetUZS,
      currentAmount: 0,
      monthlyContribution: monthlyUZS,
      targetDate: '2027-12',
    });
  };

  return (
    <section
      aria-label="Jamg'arma maqsadi so'rovnomasi"
      className="rounded-xl border border-teal-200 bg-white p-5 sm:p-6 dark:border-teal-900/60 dark:bg-slate-900"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700 dark:bg-teal-950/70 dark:text-teal-400">
            <Target className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
              So'rovnoma: Pulni nimaga yig'moqchisiz?
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Maqsadingizni tanlang — shu yurishda qachon yetishingizni hisoblab beramiz. Xohlasangiz, oddiygina o'tkazib yuborishingiz mumkin.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSkip}
            className="rounded-lg border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 whitespace-nowrap"
          >
            O'tkazib yuborish
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
            aria-label="So'rovnomani yopish"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {/* Preset Selector Buttons */}
        <div className="flex flex-wrap gap-2">
          {PRESET_GOALS.map((preset) => {
            const active = !isCustom && selectedPreset === preset.label;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'border-teal-700 bg-teal-700 text-white dark:border-teal-500 dark:bg-teal-600'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setIsCustom(true)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
              isCustom
                ? 'border-teal-700 bg-teal-700 text-white dark:border-teal-500 dark:bg-teal-600'
                : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300'
            }`}
          >
            Boshqa maqsad...
          </button>
        </div>

        {/* Quick Inputs */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {isCustom && (
            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-600 dark:text-slate-400">
                Maqsad nomi
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Masalan: Biznes boshlash"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-teal-600 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-[11px] font-medium text-slate-600 dark:text-slate-400">
              Kerakli summa ({currency})
            </label>
            <input
              type="number"
              min="1"
              value={targetInput}
              onChange={(e) => setTargetInput(e.target.value)}
              className="font-mono-num w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-teal-600 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-medium text-slate-600 dark:text-slate-400">
              Oyiga qancha ajratasiz? ({currency})
            </label>
            <input
              type="number"
              min="0"
              value={monthlyInput}
              onChange={(e) => setMonthlyInput(e.target.value)}
              className="font-mono-num w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-teal-600 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          {!isCustom && (
            <div className="flex items-end">
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-teal-600 dark:hover:bg-teal-500 whitespace-nowrap"
              >
                <span>Maqsadga qo'shish</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Live Projection Preview + Custom Submit */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
          <p className="text-slate-600 dark:text-slate-300">
            <strong className="text-slate-900 dark:text-white">Prognoz:</strong>{' '}
            {monthlyUZS > 0
              ? `Shu yurishda oyiga ${formatMoney(
                  monthlyUZS,
                  currency
                )} yig'sangiz, ${projection.projectedDatePlanned} da yetasiz.`
              : 'Oylik ajratma kiriting — muddat avtomatik hisoblanadi.'}
          </p>

          {isCustom && (
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-teal-600 dark:hover:bg-teal-500 whitespace-nowrap"
            >
              <span>Maqsadga qo'shish</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </form>
    </section>
  );
};
