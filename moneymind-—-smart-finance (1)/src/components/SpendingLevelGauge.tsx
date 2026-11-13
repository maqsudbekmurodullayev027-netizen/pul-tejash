import React from 'react';
import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { CurrencyMode, SpendingTierKey } from '../types/finance';
import { assessSpendingLevel, formatMoney } from '../utils/finance';

interface SpendingLevelGaugeProps {
  income: number;
  expense: number;
  currency: CurrencyMode;
}

const TIERS: {
  key: SpendingTierKey;
  label: string;
  range: string;
  activeBg: string;
  activeText: string;
  barColor: string;
}[] = [
  {
    key: 'alo',
    label: 'A\'lo',
    range: '0–35%',
    activeBg: 'border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/50',
    activeText: 'text-emerald-800 dark:text-emerald-300',
    barColor: 'bg-emerald-600 dark:bg-emerald-500',
  },
  {
    key: 'yaxshi',
    label: 'Yaxshi',
    range: '36–55%',
    activeBg: 'border-teal-300 bg-teal-50 dark:border-teal-800 dark:bg-teal-950/50',
    activeText: 'text-teal-800 dark:text-teal-300',
    barColor: 'bg-teal-600 dark:bg-teal-500',
  },
  {
    key: 'normal',
    label: 'Normal',
    range: '56–75%',
    activeBg: 'border-sky-300 bg-sky-50 dark:border-sky-800 dark:bg-sky-950/50',
    activeText: 'text-sky-800 dark:text-sky-300',
    barColor: 'bg-sky-600 dark:bg-sky-500',
  },
  {
    key: 'kop',
    label: 'Ko\'p',
    range: '76–90%',
    activeBg: 'border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/50',
    activeText: 'text-amber-800 dark:text-amber-300',
    barColor: 'bg-amber-500 dark:bg-amber-400',
  },
  {
    key: 'juda_kop',
    label: 'Juda ko\'p',
    range: '91%+',
    activeBg: 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/50',
    activeText: 'text-red-800 dark:text-red-300',
    barColor: 'bg-red-600 dark:bg-red-500',
  },
];

export const SpendingLevelGauge: React.FC<SpendingLevelGaugeProps> = ({
  income,
  expense,
  currency,
}) => {
  const assessment = assessSpendingLevel(income, expense);
  const activeTierObj =
    TIERS.find((t) => t.key === assessment.tier) || TIERS[2];

  const remaining = income - expense;

  return (
    <section
      aria-label="5 bosqichli xarajat darajasi nazorati"
      className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
              Xarajat intensivligi nazorati (5 bosqichli tahlil)
            </h2>
          </div>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Daromadingizga nisbatan pul ishlatish sur'atingiz:{' '}
            <strong className={`font-semibold ${activeTierObj.activeText}`}>
              {assessment.label}
            </strong>{' '}
            ({assessment.ratioPercent}% sarflandi)
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs tabular-nums">
          <div>
            <span className="text-slate-500 dark:text-slate-400">Ishlatildi: </span>
            <strong className="font-mono-num text-slate-900 dark:text-white">
              {formatMoney(expense, currency, true)}
            </strong>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400">Qolgan: </span>
            <strong
              className={`font-mono-num ${
                remaining >= 0
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {formatMoney(remaining, currency, true)}
            </strong>
          </div>
        </div>
      </div>

      {/* 5-Tier Segmented Gauge */}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {TIERS.map((tier) => {
          const isActive = tier.key === assessment.tier;
          return (
            <div
              key={tier.key}
              className={`rounded-lg border p-3 transition-colors ${
                isActive
                  ? tier.activeBg
                  : 'border-slate-200/80 bg-slate-50/50 opacity-70 dark:border-slate-800 dark:bg-slate-950/40'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span
                  className={`text-xs font-bold ${
                    isActive
                      ? tier.activeText
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {tier.label}
                </span>
                <span className="font-mono-num text-[11px] text-slate-500 dark:text-slate-400">
                  {tier.range}
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800">
                <div
                  className={`h-full rounded-full ${
                    isActive ? tier.barColor : 'bg-transparent'
                  }`}
                  style={{ width: isActive ? '100%' : '0%' }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Explicit Semantic Warning or Positive Verdict */}
      <div
        className={`mt-4 flex items-start gap-3 rounded-lg border p-3.5 text-xs ${
          assessment.tier === 'juda_kop'
            ? 'border-red-200 bg-red-50/90 text-red-950 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-100'
            : assessment.tier === 'kop'
            ? 'border-amber-200 bg-amber-50/90 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100'
            : 'border-slate-200 bg-slate-50/70 text-slate-700 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300'
        }`}
      >
        <div className="mt-0.5 shrink-0">
          {assessment.tier === 'juda_kop' ? (
            <ShieldAlert className="h-4 w-4 text-red-600 dark:text-red-400" />
          ) : assessment.tier === 'kop' ? (
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-teal-700 dark:text-teal-400" />
          )}
        </div>
        <div>
          <p className="font-bold">{assessment.headline}</p>
          <p className="mt-0.5 leading-relaxed opacity-90">{assessment.advice}</p>
        </div>
      </div>
    </section>
  );
};
