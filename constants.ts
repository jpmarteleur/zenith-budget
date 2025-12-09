import type { CategoryName } from './types';

export const CATEGORY_COLORS: Record<CategoryName, { base: string, text: string, bg: string, hex: string }> = {
  Income:   { base: 'cyan-400',    text: 'text-cyan-400',    bg: 'bg-cyan-500/10',    hex: '#22d3ee' },
  Expenses: { base: 'fuchsia-500', text: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10', hex: '#d946ef' },
  Bills:    { base: 'sky-500',     text: 'text-sky-400',     bg: 'bg-sky-500/10',     hex: '#0ea5e9' },
  Savings:  { base: 'indigo-500',  text: 'text-indigo-400',  bg: 'bg-indigo-500/10',  hex: '#6366f1' },
  Investments: { base: 'emerald-500', text: 'text-emerald-400', bg: 'bg-emerald-500/10', hex: '#10b981' },
  Debts:    { base: 'amber-400',   text: 'text-amber-300',   bg: 'bg-amber-500/10',   hex: '#f59e0b' },
};

export const FUTURISTIC_GLASS_STYLE = "bg-black/30 backdrop-blur-md border border-cyan-400/30 rounded-lg shadow-lg shadow-cyan-500/10";