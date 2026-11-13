import React, { useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Download,
  Edit3,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import {
  CurrencyMode,
  PeriodFilter,
  Transaction,
  TransactionType,
} from '../types/finance';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  TRANSFER_CATEGORIES,
} from '../data/seedData';
import {
  exportTransactionsCSV,
  filterTransactionsByPeriod,
  formatMoney,
  formatUzDate,
} from '../utils/finance';

interface TransactionsViewProps {
  transactions: Transaction[];
  currency: CurrencyMode;
  period: PeriodFilter;
  onPeriodChange: (p: PeriodFilter) => void;
  onAdd: () => void;
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  currency,
  period,
  onPeriodChange,
  onAdd,
  onEdit,
  onDelete,
}) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const allCategories = [
    ...EXPENSE_CATEGORIES,
    ...INCOME_CATEGORIES,
    ...TRANSFER_CATEGORIES,
  ];

  const filtered = useMemo(() => {
    const byPeriod = filterTransactionsByPeriod(transactions, period);
    return byPeriod
      .filter((t) => (typeFilter === 'all' ? true : t.type === typeFilter))
      .filter((t) =>
        categoryFilter === 'all' ? true : t.category === categoryFilter
      )
      .filter((t) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          t.title.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          (t.fromAccount || '').toLowerCase().includes(q) ||
          (t.toAccount || '').toLowerCase().includes(q) ||
          (t.note || '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, period, typeFilter, categoryFilter, search]);

  const totals = useMemo(() => {
    const inc = filtered
      .filter((t) => t.type === 'income')
      .reduce((s, t) => s + t.amount, 0);
    const exp = filtered
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0);
    const trf = filtered
      .filter((t) => t.type === 'transfer')
      .reduce((s, t) => s + t.amount, 0);
    return { inc, exp, trf, net: inc - exp };
  }, [filtered]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Tranzaksiyalar jurnali
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Kirim, chiqim va pul o'tkazmalarini to'liq nazorat qilish, qidirish va eksport qilish
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => exportTransactionsCSV(filtered)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap"
          >
            <Download className="h-3.5 w-3.5" />
            CSV eksport
          </button>
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 whitespace-nowrap"
          >
            <Plus className="h-3.5 w-3.5" />
            Yangi operatsiya
          </button>
        </div>
      </div>

      {/* Kirim, Chiqim, O'tkazma Tushuntirishi */}
      <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start gap-2.5">
          <ArrowDownLeft className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div className="text-xs">
            <p className="font-semibold text-slate-900 dark:text-white">
              Kirim (+) — Daromadlar
            </p>
            <p className="mt-0.5 text-slate-500 dark:text-slate-400">
              Maosh, frilans va foyda tushumlari. Balansni oshiradi.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-600 dark:text-slate-400" />
          <div className="text-xs">
            <p className="font-semibold text-slate-900 dark:text-white">
              Chiqim (-) — Xarajatlar
            </p>
            <p className="mt-0.5 text-slate-500 dark:text-slate-400">
              Kundalik sarflar va to'lovlar. Byudjetdan ayiriladi.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <ArrowLeftRight className="mt-0.5 h-4 w-4 shrink-0 text-teal-700 dark:text-teal-400" />
          <div className="text-xs">
            <p className="font-semibold text-slate-900 dark:text-white">
              O'tkazma (⇄) — Pul ko'chirish
            </p>
            <p className="mt-0.5 text-slate-500 dark:text-slate-400">
              Karta, naqd yoki maqsad jamg'armasi orasida mablag' harakati.
            </p>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 lg:flex-row lg:items-center lg:justify-between dark:border-slate-800 dark:bg-slate-900">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nomi, karta, kategoriya yoki izoh bo'yicha qidirish..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3.5 text-sm text-slate-900 outline-none focus:border-teal-600 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
            {(
              [
                { k: 'all', l: 'Barchasi' },
                { k: 'income', l: 'Kirim' },
                { k: 'expense', l: 'Chiqim' },
                { k: 'transfer', l: 'O\'tkazma' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.k}
                type="button"
                onClick={() => setTypeFilter(tab.k)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  typeFilter === tab.k
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                {tab.l}
              </button>
            ))}
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
          >
            <option value="all">Barcha kategoriyalar</option>
            {allCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={period}
            onChange={(e) => onPeriodChange(e.target.value as PeriodFilter)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
          >
            <option value="this_month">Bu oy (Noyabr 2026)</option>
            <option value="last_month">O'tgan oy (Oktabr 2026)</option>
            <option value="3_months">So'nggi 3 oy</option>
            <option value="6_months">So'nggi 6 oy</option>
            <option value="all">Barcha davr</option>
          </select>
        </div>
      </div>

      {/* Filtered Summary Bar */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-3.5 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Filtrlangan kirim
          </span>
          <p className="font-mono-num mt-1 text-base font-bold text-emerald-700 dark:text-emerald-400">
            +{formatMoney(totals.inc, currency)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-3.5 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Filtrlangan chiqim
          </span>
          <p className="font-mono-num mt-1 text-base font-bold text-slate-900 dark:text-white">
            -{formatMoney(totals.exp, currency)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-3.5 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Pul o'tkazmalari
          </span>
          <p className="font-mono-num mt-1 text-base font-bold text-teal-700 dark:text-teal-400">
            ⇄ {formatMoney(totals.trf, currency)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-3.5 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Sof natija ({filtered.length} ta operatsiya)
          </span>
          <p
            className={`font-mono-num mt-1 text-base font-bold ${
              totals.net >= 0
                ? 'text-teal-700 dark:text-teal-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {totals.net >= 0 ? '+' : ''}
            {formatMoney(totals.net, currency)}
          </p>
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        {filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              Operatsiyalar topilmadi
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Qidiruv shartlarini o'zgartiring yoki yangi moliyaviy operatsiya qo'shing.
            </p>
            <button
              type="button"
              onClick={onAdd}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-xs font-medium text-white hover:bg-teal-800"
            >
              <Plus className="h-3.5 w-3.5" />
              Birinchi operatsiyani qo'shish
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                  <th className="px-5 py-3">Operatsiya</th>
                  <th className="px-5 py-3">Kategoriya / Yo'nalish</th>
                  <th className="px-5 py-3">Sana</th>
                  <th className="px-5 py-3 text-right">Summa</th>
                  <th className="px-5 py-3 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((tx) => (
                  <tr
                    key={tx.id}
                    className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-900 dark:text-white">
                        {tx.title}
                      </p>
                      {tx.type === 'transfer' && tx.fromAccount && tx.toAccount ? (
                        <p className="mt-0.5 text-xs text-teal-700 dark:text-teal-400">
                          {tx.fromAccount} → {tx.toAccount}
                        </p>
                      ) : (
                        tx.note && (
                          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                            {tx.note}
                          </p>
                        )
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {tx.category} ·{' '}
                      {tx.type === 'income'
                        ? 'Kirim'
                        : tx.type === 'transfer'
                        ? 'O\'tkazma'
                        : 'Chiqim'}
                    </td>
                    <td className="font-mono-num px-5 py-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {formatUzDate(tx.date)}
                    </td>
                    <td
                      className={`font-mono-num px-5 py-3 text-right font-semibold whitespace-nowrap ${
                        tx.type === 'income'
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : tx.type === 'transfer'
                          ? 'text-teal-700 dark:text-teal-400'
                          : 'text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {tx.type === 'income'
                        ? '+'
                        : tx.type === 'transfer'
                        ? '⇄ '
                        : '-'}
                      {formatMoney(tx.amount, currency)}
                    </td>
                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onEdit(tx)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                          aria-label="Tahrirlash"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(tx.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                          aria-label="O'chirish"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
