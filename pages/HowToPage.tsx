import React from 'react';
import { CARD_STYLE } from '../constants';

const HowToPage: React.FC = () => {
  return (
    <div className="space-y-6 text-black/70">
      <div className={`${CARD_STYLE} p-6 md:p-8`}>
        <h2 className="text-2xl font-bold text-black/87 mb-4">Welcome to Zenith Budget!</h2>
        <p>This guide will help you understand the principles behind the app and how to get started on your journey to financial clarity.</p>
      </div>
      
      <div className={`${CARD_STYLE} p-6 md:p-8`}>
        <h3 className="text-xl font-bold text-sb-green mb-3">The Zero-Based Budgeting Method</h3>
        <p className="mb-4">
          Zenith Budget is built on the <strong className="text-black/87">zero-based budgeting</strong> method. The concept is simple: <strong className="text-black/87">give every dollar a job</strong>.
        </p>
        <p className="mb-4">
          At the beginning of each month, you plan where all of your income will go; from bills and expenses to debt payments and savings goals. Your income minus all your planned spending should equal zero.
        </p>
        <div className="bg-green-mint rounded-xl p-4">
            <h4 className="font-semibold text-black/87">The Main Goal: Left to allocate = $0</h4>
            <p className="text-sm text-black/60 mt-1">This is the most important indicator. When it's zero, it means you've created a complete plan for your income. It doesn't mean you have no money left; it means every single dollar has been intentionally allocated.</p>
        </div>
      </div>

      <div className={`${CARD_STYLE} p-6 md:p-8`}>
        <h3 className="text-xl font-bold text-sb-green mb-4">Getting Started: A Step-by-Step Guide</h3>
        <ol className="list-decimal list-inside space-y-6">
          <li>
            <strong className="text-black/87">Set Up Your Month:</strong>
            <p className="text-sm text-black/60 ml-6 mt-1">Use New month above the Budget view to create a budget for another month. You can start from scratch, keep your subcategories with zeroed-out planned amounts, or copy another month's plan to save time.</p>
          </li>
          <li>
            <strong className="text-black/87">Plan Your Budget:</strong>
            <p className="text-sm text-black/60 ml-6 mt-1">Open <strong className="text-black/70">Plan</strong>, expand a category, and add income sources or subcategories. Select a row to edit its planned amount. This is your plan. How much do you expect to earn? How much do you plan to spend on groceries? Your goal is to keep adjusting these 'Expected' amounts until your amount left to allocate is $0.</p>
          </li>
          <li>
            <strong className="text-black/87">Log Transactions (The 'Actual' Amount):</strong>
            <p className="text-sm text-black/60 ml-6 mt-1">As you go through the month, log every transaction. When you get paid, log it under 'Income'. When you buy something, log it in the appropriate expense category. The app will automatically sum these up as your <strong className="text-black/70">'Actual'</strong> spending.</p>
          </li>
          <li>
            <strong className="text-black/87">Track and Adjust:</strong>
            <p className="text-sm text-black/60 ml-6 mt-1">Use Track to compare recorded activity with your monthly plan. The progress bars will show you how much of your budget you've used. If you overspend in one area, you'll need to adjust your budget and move money from another category to stay on track.</p>
          </li>
          <li>
            <strong className="text-black/87">Exclude Subcategories from Totals (Optional):</strong>
            <p className="text-sm text-black/60 ml-6 mt-1">In Plan, edit a subcategory and clear Include in budget totals to exclude it from budget calculations. This is useful for tracking transactions that don't come from your regular income, such as:</p>
            <ul className="text-sm text-black/60 ml-12 mt-3 list-disc space-y-2">
              <li><strong className="text-black/70">Savings-funded expenses:</strong> Large purchases paid from savings (car repairs, home improvements)</li>
              <li><strong className="text-black/70">Reimbursable expenses:</strong> Work expenses you'll be reimbursed for</li>
              <li><strong className="text-black/70">Gift money or windfalls:</strong> Income that's separate from your regular budget planning</li>
            </ul>
            <p className="text-sm text-black/60 ml-6 mt-2">Excluded subcategories (marked Excluded from totals) won't affect your recorded cash flow but will still be tracked in your transaction history for record-keeping.</p>
          </li>
        </ol>
      </div>

       <div className={`${CARD_STYLE} p-6 md:p-8`}>
        <h3 className="text-xl font-bold text-sb-green mb-3">Key Indicators Explained</h3>
        <ul className="space-y-4">
            <li>
                <strong className="text-black/87">Left to allocate:</strong> This shows `Total Expected Income - Total Expected Spending`. It's your planning metric. Aim for $0.
            </li>
            <li>
                <strong className="text-black/87">Recorded cash flow:</strong> This shows `Total Actual Income - Total Actual Spending`. This is your real-time cash flow for the month.
            </li>
        </ul>
      </div>

    </div>
  );
};

export default HowToPage;
