import type { CategoryName } from './types';

// Warm, distinct café hues per budget category. `hex` is the single source of truth —
// consumers apply it via inline style so no fragile runtime-built Tailwind class is relied on.
export const CATEGORY_COLORS: Record<CategoryName, { hex: string }> = {
  Income:      { hex: '#00754A' }, // green
  Expenses:    { hex: '#C0563B' }, // terracotta
  Bills:       { hex: '#C08A2D' }, // ochre
  Savings:     { hex: '#2F7E92' }, // teal-blue
  Investments: { hex: '#77852E' }, // olive
  Debts:       { hex: '#9E3B32' }, // brick
};

// Guarded category-color lookup: a legacy or unexpected category value returns a
// neutral fallback instead of `undefined`, so a bad value can never crash the UI.
const FALLBACK_CATEGORY_COLOR = { hex: '#888888' };
export const getCategoryColor = (name: string): { hex: string } =>
  CATEGORY_COLORS[name as CategoryName] ?? FALLBACK_CATEGORY_COLOR;

// Whisper-soft white content card (Starbucks-café system) — replaces the old dark glass panel.
export const CARD_STYLE = "bg-white rounded-xl shadow-card";

// Pill buttons — full-pill radius + scale(0.95) active press (the signature micro-interaction).
const BTN_BASE = "inline-flex items-center justify-center font-semibold rounded-full transition-all duration-200 active:scale-95 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";
export const BTN_PRIMARY = `${BTN_BASE} bg-green-accent text-white hover:bg-sb-green py-2 px-5`;
export const BTN_OUTLINE = `${BTN_BASE} bg-transparent text-green-accent border border-green-accent hover:bg-green-mint py-2 px-5`;
export const BTN_GHOST = `${BTN_BASE} text-black/60 hover:bg-black/5 py-2 px-5`;
export const BTN_DANGER = `${BTN_BASE} bg-danger text-white hover:opacity-90 py-2 px-5`;

// White form control with a green focus ring.
export const INPUT_STYLE = "w-full bg-white border border-black/15 rounded-lg py-2 px-3 text-black/87 placeholder-black/40 focus:outline-none focus:ring-2 focus:ring-green-accent/40 focus:border-green-accent transition-colors";

// Matches INPUT_STYLE, but drops the OS-drawn arrow (which differs per platform and
// vanishes entirely under `appearance-none`) and leaves room on the right for the
// chevron that SelectField draws. Always render via SelectField so the arrow is there.
export const SELECT_STYLE = "w-full bg-white border border-black/15 rounded-lg py-2 pl-3 pr-9 text-black/87 focus:outline-none focus:ring-2 focus:ring-green-accent/40 focus:border-green-accent transition-colors appearance-none";
