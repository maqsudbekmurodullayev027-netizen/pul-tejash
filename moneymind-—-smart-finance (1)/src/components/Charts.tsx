import React, { useMemo, useState } from 'react';
import { CurrencyMode, ExpenseCategory } from '../types/finance';
import { CATEGORY_COLORS } from '../data/seedData';
import { formatMoney } from '../utils/finance';

interface MonthlyPoint {
  monthKey: string;
  label: string;
  income: number;
  expense: number;
  net: number;
}

interface CashflowChartProps {
  data: MonthlyPoint[];
  currency: CurrencyMode;
  mode?: 'bars' | 'line';
}

export const CashflowInteractiveChart: React.FC<CashflowChartProps> = ({
  data,
  currency,
  mode = 'bars',
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const width = 720;
  const height = 270;
  const padLeft = 64;
  const padRight = 24;
  const padTop = 24;
  const padBottom = 36;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const maxVal = useMemo(() => {
    const rawMax = Math.max(
      1,
      ...data.flatMap((d) => [d.income, d.expense, Math.abs(d.net)])
    );
    return rawMax * 1.15;
  }, [data]);

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => ({
    ratio,
    value: maxVal * ratio,
    y: padTop + chartH * (1 - ratio),
  }));

  const stepX = data.length > 0 ? chartW / data.length : chartW;

  const getY = (val: number) => padTop + chartH * (1 - Math.max(0, val) / maxVal);

  const incomePath = useMemo(() => {
    if (data.length === 0) return '';
    return data
      .map((d, i) => {
        const x = padLeft + stepX * i + stepX / 2;
        const y = getY(d.income);
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  }, [data, stepX, maxVal]);

  const expensePath = useMemo(() => {
    if (data.length === 0) return '';
    return data
      .map((d, i) => {
        const x = padLeft + stepX * i + stepX / 2;
        const y = getY(d.expense);
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  }, [data, stepX, maxVal]);

  const netPath = useMemo(() => {
    if (data.length === 0) return '';
    return data
      .map((d, i) => {
        const x = padLeft + stepX * i + stepX / 2;
        const y = getY(Math.max(0, d.net));
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  }, [data, stepX, maxVal]);

  const activePoint = hoveredIdx !== null ? data[hoveredIdx] : data[data.length - 1];

  return (
    <div className="relative w-full">
      {/* Summary readout strip for active/hovered month */}
      {activePoint && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-3 text-xs dark:border-slate-800/80">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <span className="font-semibold text-slate-900 dark:text-white">
              {activePoint.label} ({activePoint.monthKey})
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {hoveredIdx !== null ? 'Tanlangan oy tafsiloti' : 'Joriy oy ko\'rsatkichi'}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-5 tabular-nums">
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-xs bg-teal-600 dark:bg-teal-500" />
              <span className="text-slate-500 dark:text-slate-400">Daromad:</span>
              <span className="font-mono-num font-semibold text-slate-900 dark:text-white">
                {formatMoney(activePoint.income, currency)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-xs bg-slate-400 dark:bg-slate-500" />
              <span className="text-slate-500 dark:text-slate-400">Xarajat:</span>
              <span className="font-mono-num font-semibold text-slate-900 dark:text-white">
                {formatMoney(activePoint.expense, currency)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-xs bg-emerald-600 dark:bg-emerald-400" />
              <span className="text-slate-500 dark:text-slate-400">Sof jamg'arma:</span>
              <span
                className={`font-mono-num font-semibold ${
                  activePoint.net >= 0
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {activePoint.net >= 0 ? '+' : ''}
                {formatMoney(activePoint.net, currency)}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto w-full select-none"
          role="img"
          aria-label="Daromad va xarajatlar grafigi"
        >
          {/* Horizontal grid lines */}
          {yTicks.map((tick, idx) => (
            <g key={idx}>
              <line
                x1={padLeft}
                x2={width - padRight}
                y1={tick.y}
                y2={tick.y}
                className="stroke-slate-200/80 dark:stroke-slate-800"
                strokeWidth="1"
                strokeDasharray={idx === 0 ? undefined : '3 3'}
              />
              <text
                x={padLeft - 10}
                y={tick.y + 4}
                textAnchor="end"
                className="fill-slate-400 font-mono text-[10px] dark:fill-slate-500"
              >
                {tick.value === 0
                  ? '0'
                  : currency === 'USD'
                  ? `$${Math.round(tick.value / 12800)}`
                  : `${(tick.value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`}
              </text>
            </g>
          ))}

          {/* Interactive hover columns */}
          {data.map((d, i) => {
            const colX = padLeft + stepX * i;
            const centerX = colX + stepX / 2;
            const isHovered = hoveredIdx === i;
            const barWidth = Math.min(24, stepX * 0.24);

            const incY = getY(d.income);
            const incH = Math.max(2, padTop + chartH - incY);
            const expY = getY(d.expense);
            const expH = Math.max(2, padTop + chartH - expY);

            return (
              <g
                key={d.monthKey}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer"
              >
                {/* Hover highlight column */}
                <rect
                  x={colX + 4}
                  y={padTop}
                  width={Math.max(10, stepX - 8)}
                  height={chartH}
                  rx="6"
                  className={`transition-opacity duration-150 ${
                    isHovered
                      ? 'fill-slate-100/90 opacity-100 dark:fill-slate-800/50'
                      : 'fill-transparent opacity-0'
                  }`}
                />

                {mode === 'bars' && (
                  <>
                    <rect
                      x={centerX - barWidth - 3}
                      y={incY}
                      width={barWidth}
                      height={incH}
                      rx="4"
                      className={`transition-all duration-150 ${
                        isHovered
                          ? 'fill-teal-700 dark:fill-teal-400'
                          : 'fill-teal-600/90 dark:fill-teal-500/90'
                      }`}
                    />
                    <rect
                      x={centerX + 3}
                      y={expY}
                      width={barWidth}
                      height={expH}
                      rx="4"
                      className={`transition-all duration-150 ${
                        isHovered
                          ? 'fill-slate-600 dark:fill-slate-300'
                          : 'fill-slate-400/80 dark:fill-slate-600'
                      }`}
                    />
                  </>
                )}

                {/* Month label */}
                <text
                  x={centerX}
                  y={height - 12}
                  textAnchor="middle"
                  className={`text-[11px] font-medium transition-colors ${
                    isHovered
                      ? 'fill-slate-900 font-semibold dark:fill-white'
                      : 'fill-slate-500 dark:fill-slate-400'
                  }`}
                >
                  {d.label}
                </text>
              </g>
            );
          })}

          {mode === 'line' && (
            <>
              <path
                d={incomePath}
                fill="none"
                className="stroke-teal-600 dark:stroke-teal-400"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d={expensePath}
                fill="none"
                className="stroke-slate-500 dark:stroke-slate-400"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d={netPath}
                fill="none"
                className="stroke-emerald-600 dark:stroke-emerald-400"
                strokeWidth="2"
                strokeDasharray="4 4"
                strokeLinecap="round"
              />
              {data.map((d, i) => {
                const cx = padLeft + stepX * i + stepX / 2;
                const isHovered = hoveredIdx === i;
                return (
                  <g key={`dots-${d.monthKey}`} className="pointer-events-none">
                    <circle
                      cx={cx}
                      cy={getY(d.income)}
                      r={isHovered ? 5 : 3.5}
                      className="fill-teal-600 stroke-white stroke-2 dark:fill-teal-400 dark:stroke-slate-900"
                    />
                    <circle
                      cx={cx}
                      cy={getY(d.expense)}
                      r={isHovered ? 5 : 3.5}
                      className="fill-slate-500 stroke-white stroke-2 dark:fill-slate-400 dark:stroke-slate-900"
                    />
                  </g>
                );
              })}
            </>
          )}

          {/* Overlay Net Savings trend line in bar mode */}
          {mode === 'bars' && (
            <>
              <path
                d={netPath}
                fill="none"
                className="pointer-events-none stroke-emerald-600/80 dark:stroke-emerald-400/80"
                strokeWidth="2"
                strokeDasharray="4 3"
              />
              {data.map((d, i) => {
                const cx = padLeft + stepX * i + stepX / 2;
                return (
                  <circle
                    key={`net-dot-${d.monthKey}`}
                    cx={cx}
                    cy={getY(Math.max(0, d.net))}
                    r={hoveredIdx === i ? 4.5 : 3}
                    className="pointer-events-none fill-emerald-600 stroke-white stroke-[1.5] dark:fill-emerald-400 dark:stroke-slate-900"
                  />
                );
              })}
            </>
          )}
        </svg>
      </div>
    </div>
  );
};

interface CategoryBreakdownItem {
  category: ExpenseCategory;
  amount: number;
  percent: number;
}

interface CategoryDonutChartProps {
  items: CategoryBreakdownItem[];
  totalExpense: number;
  currency: CurrencyMode;
  selectedCategory: ExpenseCategory | null;
  onSelectCategory: (cat: ExpenseCategory | null) => void;
}

export const CategoryDonutChart: React.FC<CategoryDonutChartProps> = ({
  items,
  totalExpense,
  currency,
  selectedCategory,
  onSelectCategory,
}) => {
  const [hoveredCat, setHoveredCat] = useState<ExpenseCategory | null>(null);
  const activeCat = hoveredCat || selectedCategory;
  const activeItem = items.find((i) => i.category === activeCat);

  const size = 200;
  const strokeWidth = 22;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercent = 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="relative mx-auto flex h-[200px] w-[200px] items-center justify-center">
        <svg viewBox={`0 0 ${size} ${size}`} className="-rotate-90 h-full w-full">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            className="stroke-slate-100 dark:stroke-slate-800"
            strokeWidth={strokeWidth}
          />
          {items.map((item) => {
            const fraction = totalExpense > 0 ? item.amount / totalExpense : 0;
            const dashLength = Math.max(0, fraction * circumference - 2);
            const dashOffset = -cumulativePercent * circumference;
            cumulativePercent += fraction;
            const isDimmed = activeCat !== null && activeCat !== item.category;

            return (
              <circle
                key={item.category}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={CATEGORY_COLORS[item.category]}
                strokeWidth={activeCat === item.category ? strokeWidth + 3 : strokeWidth}
                strokeDasharray={`${dashLength} ${circumference}`}
                strokeDashoffset={dashOffset}
                className="cursor-pointer transition-all duration-150"
                style={{ opacity: isDimmed ? 0.32 : 1 }}
                onMouseEnter={() => setHoveredCat(item.category)}
                onMouseLeave={() => setHoveredCat(null)}
                onClick={() =>
                  onSelectCategory(
                    selectedCategory === item.category ? null : item.category
                  )
                }
              />
            );
          })}
        </svg>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {activeItem ? activeItem.category : 'Jami xarajat'}
          </span>
          <span className="font-mono-num mt-0.5 text-sm font-bold text-slate-900 dark:text-white">
            {formatMoney(activeItem ? activeItem.amount : totalExpense, currency, true)}
          </span>
          {activeItem && (
            <span className="font-mono-num mt-0.5 text-xs font-semibold text-teal-700 dark:text-teal-400">
              {activeItem.percent}%
            </span>
          )}
        </div>
      </div>

      {/* Category breakdown list */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
        {items.length === 0 ? (
          <p className="py-4 text-center text-xs text-slate-500 dark:text-slate-400">
            Tanlangan davrda xarajatlar mavjud emas.
          </p>
        ) : (
          items.map((item) => {
            const isSelected = selectedCategory === item.category;
            return (
              <button
                key={item.category}
                type="button"
                onMouseEnter={() => setHoveredCat(item.category)}
                onMouseLeave={() => setHoveredCat(null)}
                onClick={() =>
                  onSelectCategory(isSelected ? null : item.category)
                }
                className={`flex w-full items-center justify-between py-2.5 text-left text-xs transition-colors ${
                  isSelected
                    ? 'bg-slate-50 px-2 font-semibold text-slate-900 dark:bg-slate-800/60 dark:text-white'
                    : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/30'
                }`}
              >
                <div className="flex min-w-0 items-center gap-2.5 pr-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-xs"
                    style={{ backgroundColor: CATEGORY_COLORS[item.category] }}
                  />
                  <span className="truncate text-slate-700 dark:text-slate-200">
                    {item.category}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-3 tabular-nums">
                  <span className="font-mono-num text-slate-500 dark:text-slate-400">
                    {item.percent}%
                  </span>
                  <span className="font-mono-num font-medium text-slate-900 dark:text-white">
                    {formatMoney(item.amount, currency)}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

interface GoalTrajectoryChartProps {
  currentAmount: number;
  targetAmount: number;
  plannedMonthly: number;
  simulatedMonthly: number;
  currency: CurrencyMode;
}

export const GoalTrajectoryChart: React.FC<GoalTrajectoryChartProps> = ({
  currentAmount,
  targetAmount,
  plannedMonthly,
  simulatedMonthly,
  currency,
}) => {
  const [hoverMonth, setHoverMonth] = useState<number | null>(null);
  const months = Array.from({ length: 13 }, (_, i) => i);

  const points = useMemo(() => {
    return months.map((m) => ({
      month: m,
      planned: Math.min(targetAmount, currentAmount + plannedMonthly * m),
      simulated: Math.min(targetAmount, currentAmount + simulatedMonthly * m),
    }));
  }, [currentAmount, targetAmount, plannedMonthly, simulatedMonthly]);

  const width = 620;
  const height = 220;
  const padLeft = 64;
  const padRight = 24;
  const padTop = 24;
  const padBottom = 32;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const maxY = Math.max(targetAmount * 1.08, currentAmount + simulatedMonthly * 12, 1);

  const getX = (m: number) => padLeft + (m / 12) * chartW;
  const getY = (val: number) => padTop + chartH * (1 - val / maxY);

  const plannedPath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.month).toFixed(1)} ${getY(p.planned).toFixed(1)}`)
    .join(' ');

  const simulatedPath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.month).toFixed(1)} ${getY(p.simulated).toFixed(1)}`)
    .join(' ');

  const areaPath = `${simulatedPath} L ${getX(12).toFixed(1)} ${(padTop + chartH).toFixed(1)} L ${getX(0).toFixed(1)} ${(padTop + chartH).toFixed(1)} Z`;

  const activePoint = hoverMonth !== null ? points[hoverMonth] : points[6];

  return (
    <div className="w-full">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="font-medium text-slate-600 dark:text-slate-300">
          {hoverMonth !== null ? `${hoverMonth}-oy prognozi` : '6-oylik nazorat nuqtasi'}
        </span>
        <div className="flex flex-wrap items-center gap-4 tabular-nums">
          <span className="text-slate-600 dark:text-slate-300">
            Joriy reja:{' '}
            <strong className="font-mono-num text-slate-900 dark:text-white">
              {formatMoney(activePoint.planned, currency)}
            </strong>
          </span>
          {simulatedMonthly !== plannedMonthly && (
            <span className="text-teal-700 dark:text-teal-400">
              Simulyatsiya:{' '}
              <strong className="font-mono-num">
                {formatMoney(activePoint.simulated, currency)}
              </strong>
            </span>
          )}
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full select-none">
        {/* Target horizontal line */}
        <line
          x1={padLeft}
          x2={width - padRight}
          y1={getY(targetAmount)}
          y2={getY(targetAmount)}
          className="stroke-emerald-600/70 dark:stroke-emerald-400/70"
          strokeWidth="1.5"
          strokeDasharray="5 4"
        />
        <text
          x={width - padRight}
          y={getY(targetAmount) - 6}
          textAnchor="end"
          className="fill-emerald-700 font-mono text-[10px] font-semibold dark:fill-emerald-400"
        >
          Maqsad: {formatMoney(targetAmount, currency, true)}
        </text>

        {/* Base grid */}
        {[0, 0.5, 1].map((r) => {
          const val = maxY * r;
          const y = getY(val);
          return (
            <g key={r}>
              <line
                x1={padLeft}
                x2={width - padRight}
                y1={y}
                y2={y}
                className="stroke-slate-200/80 dark:stroke-slate-800"
                strokeWidth="1"
              />
              <text
                x={padLeft - 8}
                y={y + 3}
                textAnchor="end"
                className="fill-slate-400 font-mono text-[10px] dark:fill-slate-500"
              >
                {val === 0
                  ? '0'
                  : currency === 'USD'
                  ? `$${Math.round(val / 12800)}`
                  : `${(val / 1_000_000).toFixed(0)}M`}
              </text>
            </g>
          );
        })}

        <path d={areaPath} className="fill-teal-600/10 dark:fill-teal-400/10" />

        {simulatedMonthly !== plannedMonthly && (
          <path
            d={plannedPath}
            fill="none"
            className="stroke-slate-400 dark:stroke-slate-500"
            strokeWidth="2"
            strokeDasharray="4 4"
          />
        )}

        <path
          d={simulatedPath}
          fill="none"
          className="stroke-teal-600 dark:stroke-teal-400"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {points.map((p) => {
          const x = getX(p.month);
          const y = getY(p.simulated);
          const isHovered = hoverMonth === p.month;
          return (
            <g
              key={p.month}
              onMouseEnter={() => setHoverMonth(p.month)}
              onMouseLeave={() => setHoverMonth(null)}
              className="cursor-pointer"
            >
              <rect
                x={x - chartW / 26}
                y={padTop}
                width={chartW / 13}
                height={chartH}
                fill="transparent"
              />
              {(isHovered || p.month === 0 || p.month === 3 || p.month === 6 || p.month === 12) && (
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? 5 : 3.5}
                  className="fill-teal-600 stroke-white stroke-2 dark:fill-teal-400 dark:stroke-slate-900"
                />
              )}
              {p.month % 3 === 0 && (
                <text
                  x={x}
                  y={height - 10}
                  textAnchor="middle"
                  className="fill-slate-500 text-[10px] dark:fill-slate-400"
                >
                  {p.month === 0 ? 'Hozir' : `${p.month}-oy`}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};
