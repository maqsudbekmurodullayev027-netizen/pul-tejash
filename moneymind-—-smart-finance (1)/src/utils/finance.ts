import {
  BudgetLimit,
  CurrencyMode,
  ExpenseCategory,
  FinancialGoal,
  GoalProjection,
  PeriodFilter,
  Transaction,
} from '../types/finance';

export const USD_RATE = 12800;

// Anchor reference date to current month/year of workspace
export const REFERENCE_DATE = '2026-11-13';
export const CURRENT_MONTH_PREFIX = '2026-11';
export const LAST_MONTH_PREFIX = '2026-10';

const UZ_MONTHS_SHORT = [
  'Yan',
  'Fev',
  'Mar',
  'Apr',
  'May',
  'Iyun',
  'Iyul',
  'Avg',
  'Sen',
  'Okt',
  'Noy',
  'Dek',
];

const UZ_MONTHS_FULL = [
  'Yanvar',
  'Fevral',
  'Mart',
  'Aprel',
  'May',
  'Iyun',
  'Iyul',
  'Avgust',
  'Sentabr',
  'Oktabr',
  'Noyabr',
  'Dekabr',
];

export function formatMoney(
  amountUZS: number,
  currency: CurrencyMode = 'UZS',
  compact = false
): string {
  const safe = Number.isFinite(amountUZS) ? amountUZS : 0;
  if (currency === 'USD') {
    const usd = safe / USD_RATE;
    if (compact && Math.abs(usd) >= 1000) {
      return `$${(usd / 1000).toFixed(1)}K`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: Math.abs(usd) < 100 ? 2 : 0,
    }).format(usd);
  }

  if (compact) {
    const abs = Math.abs(safe);
    const sign = safe < 0 ? '-' : '';
    if (abs >= 1_000_000) {
      return `${sign}${(abs / 1_000_000).toFixed(1).replace(/\.0$/, '')} mln so'm`;
    }
    if (abs >= 1_000) {
      return `${sign}${Math.round(abs / 1_000)} ming so'm`;
    }
  }

  const rounded = Math.round(safe);
  const formatted = rounded
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${formatted} so'm`;
}

export function formatUzDate(isoDate: string): string {
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const mName = UZ_MONTHS_SHORT[monthIdx] ?? parts[1];
  return `${day}-${mName}, ${year}`;
}

export function formatMonthYearUz(year: number, monthIndex0: number): string {
  const normalizedYear = year + Math.floor(monthIndex0 / 12);
  const normalizedMonth = ((monthIndex0 % 12) + 12) % 12;
  return `${normalizedYear}-yil ${UZ_MONTHS_FULL[normalizedMonth]}`;
}

export function addMonthsLabel(monthsAhead: number): string {
  const baseYear = 2026;
  const baseMonth0 = 10; // November (0-indexed)
  return formatMonthYearUz(baseYear, baseMonth0 + Math.ceil(monthsAhead));
}

export function filterTransactionsByPeriod(
  transactions: Transaction[],
  period: PeriodFilter
): Transaction[] {
  if (period === 'all') return transactions;
  if (period === 'this_month') {
    return transactions.filter((t) => t.date.startsWith(CURRENT_MONTH_PREFIX));
  }
  if (period === 'last_month') {
    return transactions.filter((t) => t.date.startsWith(LAST_MONTH_PREFIX));
  }
  if (period === '3_months') {
    return transactions.filter((t) => t.date >= '2026-09-01');
  }
  if (period === '6_months') {
    return transactions.filter((t) => t.date >= '2026-06-01');
  }
  return transactions;
}

export function computeMonthlySeries(transactions: Transaction[]) {
  const months = [
    { key: '2026-06', label: 'Iyun' },
    { key: '2026-07', label: 'Iyul' },
    { key: '2026-08', label: 'Avg' },
    { key: '2026-09', label: 'Sen' },
    { key: '2026-10', label: 'Okt' },
    { key: '2026-11', label: 'Noy' },
  ];

  // Also include any newer months dynamically if user adds future-dated items
  const knownKeys = new Set(months.map((m) => m.key));
  for (const tx of transactions) {
    const prefix = tx.date.slice(0, 7);
    if (prefix > '2026-11' && !knownKeys.has(prefix)) {
      knownKeys.add(prefix);
      const mIdx = parseInt(prefix.slice(5, 7), 10) - 1;
      months.push({
        key: prefix,
        label: UZ_MONTHS_SHORT[mIdx] ?? prefix,
      });
    }
  }
  months.sort((a, b) => a.key.localeCompare(b.key));

  return months.map((m) => {
    const items = transactions.filter((t) => t.date.startsWith(m.key));
    const income = items
      .filter((t) => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);
    const expense = items
      .filter((t) => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);
    return {
      monthKey: m.key,
      label: m.label,
      income,
      expense,
      net: income - expense,
    };
  });
}

export function computeAverageMonthlyNetSavings(transactions: Transaction[]): number {
  const series = computeMonthlySeries(transactions);
  if (series.length === 0) return 0;
  const recent = series.slice(-3);
  const sum = recent.reduce((acc, m) => acc + m.net, 0);
  return Math.max(0, Math.round(sum / recent.length));
}

export function calculateGoalProjection(
  goal: FinancialGoal,
  actualMonthlyNetPace: number,
  currency: CurrencyMode,
  simulatedMonthlyOverride?: number
): GoalProjection {
  const remainingAmount = Math.max(0, goal.targetAmount - goal.currentAmount);
  const progressPercent =
    goal.targetAmount > 0
      ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
      : 100;

  const activePace =
    simulatedMonthlyOverride !== undefined
      ? simulatedMonthlyOverride
      : goal.monthlyContribution;

  const monthsAtPlannedPace =
    remainingAmount === 0
      ? 0
      : activePace > 0
      ? Math.ceil(remainingAmount / activePace)
      : null;

  const monthsAtActualPace =
    remainingAmount === 0
      ? 0
      : actualMonthlyNetPace > 0
      ? Math.ceil(remainingAmount / actualMonthlyNetPace)
      : null;

  const projectedDatePlanned =
    monthsAtPlannedPace === null
      ? 'Sur\'at yetarli emas'
      : monthsAtPlannedPace === 0
      ? 'Maqsadga yetildi'
      : addMonthsLabel(monthsAtPlannedPace);

  const projectedDateActual =
    monthsAtActualPace === null
      ? 'Hozirgi xarajatlar daromaddan yuqori'
      : monthsAtActualPace === 0
      ? 'Maqsadga yetildi'
      : addMonthsLabel(monthsAtActualPace);

  const amountIn3Months = Math.min(
    goal.targetAmount,
    goal.currentAmount + activePace * 3
  );
  const amountIn6Months = Math.min(
    goal.targetAmount,
    goal.currentAmount + activePace * 6
  );
  const amountIn12Months = Math.min(
    goal.targetAmount,
    goal.currentAmount + activePace * 12
  );

  let paceVerdict = '';
  if (remainingAmount === 0) {
    paceVerdict = 'Tabriklaymiz! Ushbu moliyaviy maqsad 100% jamg\'arildi.';
  } else if (activePace <= 0) {
    paceVerdict =
      'Oylik ajratma 0 bo\'lib turibdi — shu yurishda maqsadga yetish imkonsiz.';
  } else {
    const monthsLabel = monthsAtPlannedPace === 1 ? '1 oyda' : `${monthsAtPlannedPace} oyda`;
    paceVerdict = `Shu yurishda ketaversangiz (oyiga ${formatMoney(
      activePace,
      currency
    )}), 6 oyda ${formatMoney(
      amountIn6Months,
      currency
    )} yig'iladi va ${monthsLabel} (${projectedDatePlanned}) maqsadga yetasiz.`;
  }

  let paceComparisonNote = '';
  if (remainingAmount > 0 && actualMonthlyNetPace > 0 && activePace > 0) {
    if (actualMonthlyNetPace >= activePace * 1.25) {
      paceComparisonNote = `Umumiy sof jamg'armangiz (${formatMoney(
        actualMonthlyNetPace,
        currency
      )}/oy) rejadagidan tezroq — maqsadni ertaroq yopishingiz mumkin.`;
    } else if (actualMonthlyNetPace < activePace) {
      paceComparisonNote = `Umumiy erkin pul oqimingiz (${formatMoney(
        actualMonthlyNetPace,
        currency
      )}/oy) ajratilgan sur'atdan pastroq. Xarajatlarni nazorat qilish tavsiya etiladi.`;
    } else {
      paceComparisonNote = `Hozirgi daromad va xarajatlaringiz muvozanati bu maqsad sur'atini to'liq qo'llab-quvvatlaydi.`;
    }
  }

  return {
    remainingAmount,
    progressPercent,
    monthsAtPlannedPace,
    projectedDatePlanned,
    monthsAtActualPace,
    projectedDateActual,
    amountIn3Months,
    amountIn6Months,
    amountIn12Months,
    paceVerdict,
    paceComparisonNote,
  };
}

export interface ExpenseRiskAssessment {
  budgetWarning: string | null;
  savingsWarning: string | null;
  severity: 'none' | 'warning' | 'danger';
  newCategoryPercent: number | null;
}

export function evaluateExpenseRisk(
  amountUZS: number,
  category: ExpenseCategory,
  transactions: Transaction[],
  budgets: BudgetLimit[],
  currency: CurrencyMode
): ExpenseRiskAssessment {
  if (!amountUZS || amountUZS <= 0) {
    return {
      budgetWarning: null,
      savingsWarning: null,
      severity: 'none',
      newCategoryPercent: null,
    };
  }

  const currentMonthTx = transactions.filter((t) =>
    t.date.startsWith(CURRENT_MONTH_PREFIX)
  );
  const currentIncome = currentMonthTx
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);
  const currentExpense = currentMonthTx
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);

  const freeCashflow = currentIncome - currentExpense;

  const budgetItem = budgets.find((b) => b.category === category);
  const categorySpent = currentMonthTx
    .filter((t) => t.type === 'expense' && t.category === category)
    .reduce((s, t) => s + t.amount, 0);

  let budgetWarning: string | null = null;
  let savingsWarning: string | null = null;
  let severity: 'none' | 'warning' | 'danger' = 'none';
  let newCategoryPercent: number | null = null;

  if (budgetItem && budgetItem.limit > 0) {
    const projectedSpent = categorySpent + amountUZS;
    newCategoryPercent = Math.round((projectedSpent / budgetItem.limit) * 100);
    if (newCategoryPercent > 100) {
      severity = 'danger';
      budgetWarning = `Diqqat! "${category}" byudjet limiti (${formatMoney(
        budgetItem.limit,
        currency
      )}) ${newCategoryPercent}% ga oshib ketadi.`;
    } else if (newCategoryPercent >= 80) {
      severity = 'warning';
      budgetWarning = `Ogohlantirish: "${category}" oylik byudjetining ${newCategoryPercent}% qismi ishlatiladi.`;
    }
  }

  if (amountUZS > freeCashflow) {
    severity = 'danger';
    savingsWarning = `Bu xarajat joriy oydagi erkin qoldiqdan (${formatMoney(
      Math.max(0, freeCashflow),
      currency
    )}) oshib ketadi — jamg'arma va maqsadlaringiz sekinlashadi. Tejamkorlikka e'tibor bering!`;
  } else if (freeCashflow - amountUZS < currentIncome * 0.15 && currentIncome > 0) {
    if (severity === 'none') severity = 'warning';
    savingsWarning = `Xarajatlardan so'ng oylik jamg'arma ulushi 15% dan pastga tushadi.`;
  }

  return {
    budgetWarning,
    savingsWarning,
    severity,
    newCategoryPercent,
  };
}

export function exportTransactionsCSV(transactions: Transaction[]) {
  const headers = [
    'Sana',
    'Nomi',
    'Turi',
    'Kategoriya',
    'Qayerdan',
    'Qayerga',
    'Summa (UZS)',
    'Izoh',
  ];
  const rows = transactions.map((t) => [
    t.date,
    `"${(t.title || '').replace(/"/g, '""')}"`,
    t.type === 'income'
      ? 'Daromad (Kirim)'
      : t.type === 'expense'
      ? 'Xarajat (Chiqim)'
      : 'Pul o\'tkazmasi',
    `"${t.category}"`,
    `"${t.fromAccount || '-'}"`,
    `"${t.toAccount || '-'}"`,
    t.amount.toString(),
    `"${(t.note || '').replace(/"/g, '""')}"`,
  ]);
  const csvContent =
    '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `moneymind-operatsiyalar-${REFERENCE_DATE}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function assessSpendingLevel(
  income: number,
  expense: number
): import('../types/finance').SpendingAssessment {
  if (income <= 0 && expense <= 0) {
    return {
      tier: 'normal',
      label: 'Normal',
      ratioPercent: 0,
      headline: 'Ma\'lumot kutilmoqda',
      advice: 'Daromad va xarajatlarni kiritsangiz, sarf darajangiz avtomatik baholanadi.',
      isCritical: false,
    };
  }

  const ratioPercent =
    income > 0 ? Math.round((expense / income) * 100) : 100;

  if (ratioPercent <= 35) {
    return {
      tier: 'alo',
      label: 'A\'lo',
      ratioPercent,
      headline: 'A\'lo darajada tejamkorlik!',
      advice: `Daromadingizning atigi ${ratioPercent}% qismi sarflanmoqda. Jamg'arma maqsadlaringizga juda tez erishasiz.`,
      isCritical: false,
    };
  }
  if (ratioPercent <= 55) {
    return {
      tier: 'yaxshi',
      label: 'Yaxshi',
      ratioPercent,
      headline: 'Yaxshi moliyaviy intizom',
      advice: `Xarajatlar daromadning ${ratioPercent}% qismini tashkil etmoqda. Jamg'arma va sarflar muvozanatda.`,
      isCritical: false,
    };
  }
  if (ratioPercent <= 75) {
    return {
      tier: 'normal',
      label: 'Normal',
      ratioPercent,
      headline: 'Normal xarajat darajasi',
      advice: `Daromadning ${ratioPercent}% qismi ishlatilmoqda. Qolgan mablag'ni maqsadlarga yo'naltirishda davom eting.`,
      isCritical: false,
    };
  }
  if (ratioPercent <= 90) {
    return {
      tier: 'kop',
      label: 'Ko\'p',
      ratioPercent,
      headline: 'Xarajatlar ko\'payib bormoqda',
      advice: `Daromadingizning ${ratioPercent}% qismi sarflandi. Ikkinchi darajali chiqimlarni cheklash tavsiya etiladi.`,
      isCritical: true,
    };
  }
  return {
    tier: 'juda_kop',
    label: 'Juda ko\'p',
    ratioPercent,
    headline: 'Siz juda ko\'p xarajat qilib yuborayapsiz!',
    advice:
      ratioPercent > 100
        ? `Xarajatlaringiz daromadingizdan oshib ketdi (${ratioPercent}%). Zudlik bilan sarflarni to'xtatib, tejashingiz kerak!`
        : `Daromadingizning ${ratioPercent}% qismi sarflab bo'lindi. Jamg'arma qolmayapti — xarajatlarni kamaytiring!`,
    isCritical: true,
  };
}

export function exportAllDataJSON(data: unknown) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `moneymind-zaxira-${REFERENCE_DATE}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
