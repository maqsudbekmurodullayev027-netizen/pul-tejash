import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeftRight,
  Info,
  ShieldAlert,
  TrendingUp,
  X,
} from 'lucide-react';
import {
  BudgetLimit,
  CurrencyMode,
  ExpenseCategory,
  FinancialGoal,
  Transaction,
  TransactionCategory,
  TransactionType,
} from '../types/finance';
import {
  ACCOUNT_OPTIONS,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  TRANSFER_CATEGORIES,
} from '../data/seedData';
import {
  USD_RATE,
  calculateGoalProjection,
  evaluateExpenseRisk,
  formatMoney,
  REFERENCE_DATE,
} from '../utils/finance';

interface TransactionModalProps {
  isOpen: boolean;
  editingTx: Transaction | null;
  transactions: Transaction[];
  budgets: BudgetLimit[];
  goals: FinancialGoal[];
  currency: CurrencyMode;
  onClose: () => void;
  onSave: (tx: Omit<Transaction, 'id'>, existingId?: string) => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  editingTx,
  transactions,
  budgets,
  goals,
  currency,
  onClose,
  onSave,
}) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [title, setTitle] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [category, setCategory] = useState<TransactionCategory>('Oziq-ovqat');
  const [fromAccount, setFromAccount] = useState(ACCOUNT_OPTIONS[0]);
  const [toAccount, setToAccount] = useState(ACCOUNT_OPTIONS[1]);
  const [linkedGoalId, setLinkedGoalId] = useState<string>('');
  const [date, setDate] = useState(REFERENCE_DATE);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    if (editingTx) {
      setType(editingTx.type);
      setTitle(editingTx.title);
      const displayAmount =
        currency === 'USD'
          ? Math.round((editingTx.amount / USD_RATE) * 100) / 100
          : editingTx.amount;
      setAmountInput(String(displayAmount));
      setCategory(editingTx.category);
      setFromAccount(editingTx.fromAccount || ACCOUNT_OPTIONS[0]);
      setToAccount(editingTx.toAccount || ACCOUNT_OPTIONS[1]);
      setLinkedGoalId(editingTx.linkedGoalId || '');
      setDate(editingTx.date);
      setNote(editingTx.note || '');
    } else {
      setType('expense');
      setTitle('');
      setAmountInput('');
      setCategory('Oziq-ovqat');
      setFromAccount(ACCOUNT_OPTIONS[0]);
      setToAccount(ACCOUNT_OPTIONS[1]);
      setLinkedGoalId('');
      setDate(REFERENCE_DATE);
      setNote('');
    }
    setError('');
  }, [isOpen, editingTx, currency]);

  const handleTypeChange = (nextType: TransactionType) => {
    setType(nextType);
    if (nextType === 'expense') {
      setCategory(EXPENSE_CATEGORIES[0]);
      setLinkedGoalId('');
    } else if (nextType === 'income') {
      setCategory(INCOME_CATEGORIES[0]);
      setLinkedGoalId('');
    } else {
      setCategory(TRANSFER_CATEGORIES[0]);
    }
  };

  const parsedUZS = useMemo(() => {
    const raw = parseFloat(amountInput.replace(/\s+/g, ''));
    if (!Number.isFinite(raw) || raw <= 0) return 0;
    return currency === 'USD' ? Math.round(raw * USD_RATE) : Math.round(raw);
  }, [amountInput, currency]);

  const risk = useMemo(() => {
    if (type !== 'expense' || editingTx) {
      return {
        budgetWarning: null,
        savingsWarning: null,
        severity: 'none' as const,
        newCategoryPercent: null,
      };
    }
    return evaluateExpenseRisk(
      parsedUZS,
      category as ExpenseCategory,
      transactions,
      budgets,
      currency
    );
  }, [type, editingTx, parsedUZS, category, transactions, budgets, currency]);

  if (!isOpen) return null;

  const categories =
    type === 'expense'
      ? EXPENSE_CATEGORIES
      : type === 'income'
      ? INCOME_CATEGORIES
      : TRANSFER_CATEGORIES;

  const typeExplanation =
    type === 'expense'
      ? 'Chiqim (Xarajat): kundalik va oylik sarflar. Umumiy balansni kamaytiradi va byudjet limitiga ta\'sir qiladi.'
      : type === 'income'
      ? 'Kirim (Daromad): maosh, frilans yoki boshqa tushumlar. Umumiy balans va jamg\'arma imkoniyatini oshiradi.'
      : 'Pul o\'tkazmasi: o\'z kartalaringiz, naqd pul yoki moliyaviy maqsad jamg\'armasi o\'rtasida mablag\' ko\'chirish.';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const resolvedTitle =
      title.trim() ||
      (type === 'transfer'
        ? `${fromAccount} → ${
            linkedGoalId
              ? goals.find((g) => g.id === linkedGoalId)?.title || toAccount
              : toAccount
          }`
        : '');

    if (!resolvedTitle) {
      setError('Operatsiya nomini kiriting.');
      return;
    }
    if (parsedUZS <= 0) {
      setError('To\'g\'ri summa kiriting.');
      return;
    }
    const targetGoal = linkedGoalId
      ? goals.find((g) => g.id === linkedGoalId)
      : undefined;

    onSave(
      {
        title: resolvedTitle,
        amount: parsedUZS,
        type,
        category,
        date,
        note: note.trim() || undefined,
        fromAccount: type === 'transfer' ? fromAccount : undefined,
        toAccount:
          type === 'transfer'
            ? targetGoal
              ? targetGoal.title
              : toAccount
            : undefined,
        linkedGoalId: type === 'transfer' && linkedGoalId ? linkedGoalId : undefined,
      },
      editingTx?.id
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tx-modal-title"
    >
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <h2
            id="tx-modal-title"
            className="font-display text-lg font-bold text-slate-900 dark:text-white"
          >
            {editingTx ? 'Operatsiyani tahrirlash' : 'Yangi moliyaviy operatsiya'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
            aria-label="Yopish"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* 3-Way Type Switcher */}
          <div className="grid grid-cols-3 gap-1.5 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`rounded-md py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                type === 'expense'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Chiqim (Xarajat)
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`rounded-md py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                type === 'income'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Kirim (Daromad)
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('transfer')}
              className={`rounded-md py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                type === 'transfer'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Pul o'tkazmasi
            </button>
          </div>

          {/* Clear Type Explanation Box */}
          <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
            {type === 'transfer' ? (
              <ArrowLeftRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-700 dark:text-teal-400" />
            ) : (
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-700 dark:text-teal-400" />
            )}
            <span className="leading-relaxed">{typeExplanation}</span>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
              Tavsif / Nomi
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                type === 'expense'
                  ? 'Masalan: Korzinka oziq-ovqat xaridi'
                  : type === 'income'
                  ? 'Masalan: Asosiy oylik maosh'
                  : 'Masalan: Humo kartaga o\'tkazma (ixtiyoriy)'
              }
              className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-teal-600 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-teal-500"
            />
          </div>

          {type === 'transfer' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Qayerdan (Hisob / Karta)
                </label>
                <select
                  value={fromAccount}
                  onChange={(e) => setFromAccount(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-600 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                >
                  {ACCOUNT_OPTIONS.filter((a) => !a.includes('P2P')).map((acc) => (
                    <option key={acc} value={acc}>
                      {acc}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Qayerga (Karta yoki Maqsad)
                </label>
                <select
                  value={linkedGoalId ? `goal:${linkedGoalId}` : toAccount}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val.startsWith('goal:')) {
                      const gId = val.replace('goal:', '');
                      setLinkedGoalId(gId);
                      setCategory('Jamg\'armaga o\'tkazma');
                    } else {
                      setLinkedGoalId('');
                      setToAccount(val);
                    }
                  }}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-600 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                >
                  <optgroup label="Hisoblar va kartalar">
                    {ACCOUNT_OPTIONS.map((acc) => (
                      <option key={acc} value={acc}>
                        {acc}
                      </option>
                    ))}
                  </optgroup>
                  {goals.length > 0 && (
                    <optgroup label="Moliyaviy maqsadlarga">
                      {goals.map((g) => (
                        <option key={g.id} value={`goal:${g.id}`}>
                          Maqsad: {g.title}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Summa ({currency})
              </label>
              <input
                type="number"
                step={currency === 'USD' ? '0.01' : '1000'}
                min="0"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                placeholder={currency === 'USD' ? '150' : '500000'}
                className="font-mono-num w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-teal-600 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-teal-500"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Sana
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="font-mono-num w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-teal-600 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
              Kategoriya
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as TransactionCategory)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-teal-600 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-teal-500"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
              Qo'shimcha izoh (ixtiyoriy)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Qisqacha eslatma..."
              className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-teal-600 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-teal-500"
            />
          </div>

          {/* Live Smart Budget & Savings Guard */}
          {(risk.budgetWarning || risk.savingsWarning) && (
            <div
              className={`rounded-lg border p-3.5 text-xs ${
                risk.severity === 'danger'
                  ? 'border-red-200 bg-red-50/90 text-red-900 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200'
                  : 'border-amber-200 bg-amber-50/90 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="space-y-1">
                  {risk.budgetWarning && <p className="font-medium">{risk.budgetWarning}</p>}
                  {risk.savingsWarning && <p>{risk.savingsWarning}</p>}
                </div>
              </div>
            </div>
          )}

          {error && (
            <p className="text-xs font-medium text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 whitespace-nowrap"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              className="rounded-lg bg-teal-700 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 whitespace-nowrap"
            >
              {editingTx ? 'Saqlash' : 'Qo\'shish'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface GoalModalProps {
  isOpen: boolean;
  editingGoal: FinancialGoal | null;
  currency: CurrencyMode;
  actualMonthlyNetPace: number;
  onClose: () => void;
  onSave: (goal: Omit<FinancialGoal, 'id' | 'createdAt'>, existingId?: string) => void;
}

export const GoalModal: React.FC<GoalModalProps> = ({
  isOpen,
  editingGoal,
  currency,
  actualMonthlyNetPace,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Texnika va karyera');
  const [targetInput, setTargetInput] = useState('');
  const [currentInput, setCurrentInput] = useState('');
  const [monthlyInput, setMonthlyInput] = useState('');
  const [targetDate, setTargetDate] = useState('2027-06');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const toDisplay = (uzs: number) =>
      currency === 'USD' ? String(Math.round(uzs / USD_RATE)) : String(uzs);

    if (editingGoal) {
      setTitle(editingGoal.title);
      setCategory(editingGoal.category);
      setTargetInput(toDisplay(editingGoal.targetAmount));
      setCurrentInput(toDisplay(editingGoal.currentAmount));
      setMonthlyInput(toDisplay(editingGoal.monthlyContribution));
      setTargetDate(editingGoal.targetDate);
    } else {
      setTitle('');
      setCategory('Shaxsiy maqsad');
      setTargetInput(currency === 'USD' ? '2000' : '25000000');
      setCurrentInput(currency === 'USD' ? '300' : '3500000');
      setMonthlyInput(currency === 'USD' ? '200' : '2500000');
      setTargetDate('2027-08');
    }
    setError('');
  }, [isOpen, editingGoal, currency]);

  const toUZS = (val: string) => {
    const n = parseFloat(val.replace(/\s+/g, ''));
    if (!Number.isFinite(n) || n < 0) return 0;
    return currency === 'USD' ? Math.round(n * USD_RATE) : Math.round(n);
  };

  const previewGoal: FinancialGoal = {
    id: 'preview',
    title: title || 'Maqsad',
    category,
    targetAmount: Math.max(1, toUZS(targetInput)),
    currentAmount: toUZS(currentInput),
    monthlyContribution: toUZS(monthlyInput),
    targetDate,
    createdAt: REFERENCE_DATE,
  };

  const previewProjection = useMemo(
    () => calculateGoalProjection(previewGoal, actualMonthlyNetPace, currency),
    [
      previewGoal.targetAmount,
      previewGoal.currentAmount,
      previewGoal.monthlyContribution,
      actualMonthlyNetPace,
      currency,
    ]
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tAmount = toUZS(targetInput);
    const cAmount = toUZS(currentInput);
    const mAmount = toUZS(monthlyInput);
    if (!title.trim()) {
      setError('Maqsad nomini kiriting.');
      return;
    }
    if (tAmount <= 0) {
      setError('Maqsad summasi 0 dan katta bo\'lishi kerak.');
      return;
    }
    onSave(
      {
        title: title.trim(),
        category: category.trim() || 'Shaxsiy maqsad',
        targetAmount: tAmount,
        currentAmount: Math.min(cAmount, tAmount),
        monthlyContribution: mAmount,
        targetDate,
      },
      editingGoal?.id
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
            {editingGoal ? 'Maqsadni tahrirlash' : 'Yangi moliyaviy maqsad'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Nima uchun pul yig'yapsiz?
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Masalan: Uy ta'miri yoki Ta'til"
                className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-600 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Yo'nalish
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Masalan: Katta xarid"
                className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-600 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Maqsad summasi ({currency})
              </label>
              <input
                type="number"
                min="0"
                value={targetInput}
                onChange={(e) => setTargetInput(e.target.value)}
                className="font-mono-num w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-600 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Hozir yig'ilgan ({currency})
              </label>
              <input
                type="number"
                min="0"
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                className="font-mono-num w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-600 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Oylik ajratma sur'ati ({currency})
              </label>
              <input
                type="number"
                min="0"
                value={monthlyInput}
                onChange={(e) => setMonthlyInput(e.target.value)}
                className="font-mono-num w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-600 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Mo'ljallangan sana
              </label>
              <input
                type="month"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="font-mono-num w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-600 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
          </div>

          {/* Live Pace Projection Preview */}
          <div className="rounded-lg border border-teal-200 bg-teal-50/70 p-3.5 text-xs text-teal-950 dark:border-teal-900/60 dark:bg-teal-950/30 dark:text-teal-100">
            <div className="flex items-start gap-2.5">
              <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-teal-700 dark:text-teal-400" />
              <div>
                <p className="font-semibold">Sur'at tahlili (Shu yurishda ketaversa):</p>
                <p className="mt-1 leading-relaxed">{previewProjection.paceVerdict}</p>
              </div>
            </div>
          </div>

          {error && (
            <p className="text-xs font-medium text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              className="rounded-lg bg-teal-700 px-5 py-2 text-sm font-medium text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500"
            >
              {editingGoal ? 'Saqlash' : 'Maqsad yaratish'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface GoalContributeModalProps {
  goal: FinancialGoal | null;
  currency: CurrencyMode;
  onClose: () => void;
  onContribute: (goalId: string, amountUZS: number) => void;
}

export const GoalContributeModal: React.FC<GoalContributeModalProps> = ({
  goal,
  currency,
  onClose,
  onContribute,
}) => {
  const [amountInput, setAmountInput] = useState('');

  useEffect(() => {
    if (!goal) return;
    const def = goal.monthlyContribution || 1000000;
    setAmountInput(
      currency === 'USD' ? String(Math.round(def / USD_RATE)) : String(def)
    );
  }, [goal, currency]);

  if (!goal) return null;

  const parsedUZS = (() => {
    const n = parseFloat(amountInput);
    if (!Number.isFinite(n) || n <= 0) return 0;
    return currency === 'USD' ? Math.round(n * USD_RATE) : Math.round(n);
  })();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedUZS <= 0) return;
    onContribute(goal.id, parsedUZS);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
            Jamg'armaga pul qo'shish
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-xs dark:border-slate-800 dark:bg-slate-950">
            <p className="font-semibold text-slate-900 dark:text-white">
              {goal.title}
            </p>
            <p className="mt-1 text-slate-500 dark:text-slate-400">
              Hozirgi jamg'arma:{' '}
              <span className="font-mono-num font-semibold text-slate-900 dark:text-white">
                {formatMoney(goal.currentAmount, currency)}
              </span>{' '}
              / {formatMoney(goal.targetAmount, currency)}
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
              Qo'shiladigan summa ({currency})
            </label>
            <input
              type="number"
              min="1"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              className="font-mono-num w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-600 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              className="rounded-lg bg-teal-700 px-5 py-2 text-sm font-medium text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500"
            >
              Jamg'armaga qo'shish
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface GoalWithdrawWarningModalProps {
  goal: FinancialGoal | null;
  currency: CurrencyMode;
  onClose: () => void;
  onKeepSaving: (goal: FinancialGoal) => void;
  onConfirmWithdraw: (
    goal: FinancialGoal,
    withdrawAmountUZS: number,
    recordAsExpense: boolean
  ) => void;
}

export const GoalWithdrawWarningModal: React.FC<GoalWithdrawWarningModalProps> = ({
  goal,
  currency,
  onClose,
  onKeepSaving,
  onConfirmWithdraw,
}) => {
  const [withdrawMode, setWithdrawMode] = useState<'full' | 'partial'>('full');
  const [partialInput, setPartialInput] = useState('');
  const [recordAsExpense, setRecordAsExpense] = useState(true);

  useEffect(() => {
    if (!goal) return;
    setWithdrawMode('full');
    const half = Math.round(goal.currentAmount * 0.5);
    setPartialInput(
      currency === 'USD' ? String(Math.round(half / USD_RATE)) : String(half)
    );
    setRecordAsExpense(true);
  }, [goal, currency]);

  if (!goal) return null;

  const withdrawUZS =
    withdrawMode === 'full'
      ? goal.currentAmount
      : (() => {
          const n = parseFloat(partialInput);
          if (!Number.isFinite(n) || n <= 0) return 0;
          const raw = currency === 'USD' ? Math.round(n * USD_RATE) : Math.round(n);
          return Math.min(raw, goal.currentAmount);
        })();

  const isFullOrMajor =
    goal.currentAmount > 0 && withdrawUZS >= goal.currentAmount * 0.8;
  const remainingAfter = Math.max(0, goal.currentAmount - withdrawUZS);
  const delayMonths =
    goal.monthlyContribution > 0
      ? Math.ceil(withdrawUZS / goal.monthlyContribution)
      : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-[2px]"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="withdraw-warning-title"
    >
      <div className="w-full max-w-lg rounded-xl border border-red-200 bg-white p-6 shadow-2xl dark:border-red-900/60 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4 border-b border-red-100 pb-4 dark:border-red-900/40">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-400">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="withdraw-warning-title"
                className="font-display text-lg font-bold text-slate-900 dark:text-white"
              >
                {isFullOrMajor
                  ? 'Siz pulni to\'liq ishlatasizmi? Siz tejashingiz kerak!'
                  : 'Diqqat! Jamg\'armadan foydalanmoqchimisiz?'}
              </h2>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                «{goal.title}» maqsadi uchun yig'ilgan mablag'dan foydalanish
                ogohlantirishi
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div className="rounded-lg border border-amber-200 bg-amber-50/90 p-4 text-xs leading-relaxed text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
            <p className="font-semibold">
              Ogohlantiruvchi eslatma: Siz tejashingiz kerak!
            </p>
            <p className="mt-1">
              {isFullOrMajor
                ? `Agar yig'ilgan ${formatMoney(
                    withdrawUZS,
                    currency
                  )} mablag'ni to'liq ishlatsangiz, barcha jamg'arma nolga tushadi va maqsadingizga erishish kamida ${delayMonths} oyga orqaga suriladi.`
                : `Agar ${formatMoney(
                    withdrawUZS,
                    currency
                  )} miqdorida mablag' yechsangiz, maqsadingizga yetish muddati ${delayMonths} oyga kechikadi.`}
            </p>
          </div>

          {/* Mode Toggle */}
          <div className="grid grid-cols-2 gap-1.5 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setWithdrawMode('full')}
              className={`rounded-md py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                withdrawMode === 'full'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              To'liq ishlatish ({formatMoney(goal.currentAmount, currency, true)})
            </button>
            <button
              type="button"
              onClick={() => setWithdrawMode('partial')}
              className={`rounded-md py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                withdrawMode === 'partial'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              Faqat bir qismini olish
            </button>
          </div>

          {withdrawMode === 'partial' && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Ishlatiladigan summa ({currency})
              </label>
              <input
                type="number"
                min="1"
                value={partialInput}
                onChange={(e) => setPartialInput(e.target.value)}
                className="font-mono-num w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-red-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
          )}

          {/* Impact Table */}
          <div className="grid grid-cols-3 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-xs dark:border-slate-800 dark:bg-slate-950">
            <div>
              <span className="text-slate-500 dark:text-slate-400">Hozirgi qoldiq</span>
              <p className="font-mono-num mt-0.5 font-semibold text-slate-900 dark:text-white">
                {formatMoney(goal.currentAmount, currency, true)}
              </p>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400">Yechilgandan so'ng</span>
              <p className="font-mono-num mt-0.5 font-semibold text-red-600 dark:text-red-400">
                {formatMoney(remainingAfter, currency, true)}
              </p>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400">Kechikish</span>
              <p className="font-mono-num mt-0.5 font-semibold text-amber-700 dark:text-amber-400">
                +{delayMonths} oy
              </p>
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              checked={recordAsExpense}
              onChange={(e) => setRecordAsExpense(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
            />
            <span>Ushbu summani xarajatlar ro'yxatiga ham avtomatik qayd etish</span>
          </label>

          <div className="flex flex-col-reverse gap-2.5 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end dark:border-slate-800">
            <button
              type="button"
              disabled={withdrawUZS <= 0}
              onClick={() => {
                onConfirmWithdraw(goal, withdrawUZS, recordAsExpense);
                onClose();
              }}
              className="rounded-lg border border-red-200 bg-white px-4 py-2.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-900/60 dark:bg-slate-900 dark:text-red-400 dark:hover:bg-red-950/50 whitespace-nowrap"
            >
              Ha, baribir ishlataman
            </button>
            <button
              type="button"
              onClick={() => {
                onKeepSaving(goal);
                onClose();
              }}
              className="rounded-lg bg-teal-700 px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 whitespace-nowrap"
            >
              Yo'q, tejashda davom etaman
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
