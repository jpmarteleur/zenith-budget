import React from 'react';

const steps = [
  { title: 'Set up your month', text: 'Use New month on Budget. Copy a previous plan, keep its subcategories with planned amounts reset to zero, or start from scratch. Copying brings over the plan, never its transaction history, and cannot overwrite an existing month.' },
  { title: 'Give your income a job', text: 'Open Plan and expand a category. Add income sources and subcategories, then select a row to edit its planned amount. Income, Expenses, Bills, Savings, Investments, and Debts each have their own place. Aim for zero left to allocate.' },
  { title: 'Record everyday activity', text: 'Use Add transaction, then Quick entry for AI suggestions or Manual to enter the details yourself. Review the category, subcategory, amount, date, and note before saving. Transaction dates stay within the selected budget month.' },
  { title: 'Track and adjust', text: 'Open Track to compare recorded activity with your plan. Expand categories for the details. Transaction history sits below both views, where you can edit or delete entries. Adjust allocations in Plan as your needs change.' },
];

const HowToPage: React.FC = () => (
  <div className="mx-auto max-w-4xl space-y-6 text-sm leading-relaxed text-black/70">
    <header>
      <h1 className="font-serif text-2xl font-semibold tracking-tight text-house-green">How to use Zenith</h1>
      <p className="mt-2 text-black/60">A plan for the month. A clearer view of the everyday.</p>
    </header>

    <section aria-labelledby="method-title" className="rounded-2xl border border-black/10 bg-white p-5 sm:p-6">
      <h2 id="method-title" className="text-lg font-semibold tracking-tight text-house-green">Give every dollar a purpose</h2>
      <p className="mt-2">Zenith uses zero-based budgeting: plan how your income will cover expenses, bills, savings, investments, and debt payments. A fully allocated plan means every dollar has a job, not that your bank account is empty.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-green-mint/40 p-4">
          <h3 className="font-semibold text-house-green">Plan: left to allocate</h3>
          <p className="mt-1">Planned income minus planned allocations. Aim for zero, then adjust as needed.</p>
        </div>
        <div className="rounded-xl bg-cream p-4">
          <h3 className="font-semibold text-house-green">Track: recorded cash flow</h3>
          <p className="mt-1">Recorded income minus recorded outflows. This reflects your entries, not your bank balance.</p>
        </div>
      </div>
    </section>

    <section aria-labelledby="steps-title" className="rounded-2xl border border-black/10 bg-white p-5 sm:p-6">
      <h2 id="steps-title" className="text-lg font-semibold tracking-tight text-house-green">Your first month, step by step</h2>
      <ol className="mt-5 divide-y divide-black/10">
        {steps.map((step, index) => <li key={step.title} className="flex gap-4 py-5 first:pt-0 last:pb-0">
          <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-mint/50 text-sm font-semibold text-house-green">{index + 1}</span>
          <div className="min-w-0"><h3 className="font-semibold text-black/87">{step.title}</h3><p className="mt-1">{step.text}</p></div>
        </li>)}
      </ol>
    </section>

    <section aria-labelledby="details-title" className="rounded-2xl border border-black/10 bg-white p-5 sm:p-6">
      <h2 id="details-title" className="text-lg font-semibold tracking-tight text-house-green">A few useful details</h2>
      <div className="mt-5 space-y-5 divide-y divide-black/10">
        <div>
          <h3 className="font-semibold text-black/87">Keep some activity outside your totals</h3>
          <p className="mt-1">In Plan, edit a subcategory and clear Include in budget totals. Its planned and recorded amounts are excluded from category totals and cash flow, while its activity remains visible in the subcategory and transaction history. This can help with reimbursable or savings-funded purchases.</p>
        </div>
        <div className="pt-5">
          <h3 className="font-semibold text-black/87">Set up regular transactions</h3>
          <p className="mt-1">Add monthly recurring rules in Settings. Review due rules and adjust amounts when creating a month or applying them from Budget. Due rules also apply automatically to an existing current-month budget while you use the app. This is not a background scheduler. Pausing, editing, or deleting a rule keeps its historical transactions.</p>
        </div>
        <div className="pt-5">
          <h3 className="font-semibold text-black/87">Choose how amounts are displayed</h3>
          <p className="mt-1">Settings offers USD, EUR, and GBP formatting. Changing currency changes the display, without converting stored amounts at an exchange rate.</p>
        </div>
        <div className="pt-5">
          <h3 className="font-semibold text-black/87">Try things out as a guest</h3>
          <p className="mt-1">Guest budgets and recurring rules are stored only in this browser. They stay separate from signed-in accounts and are not transferred when you sign in. Signing out of guest mode clears them.</p>
        </div>
      </div>
    </section>
  </div>
);

export default HowToPage;
