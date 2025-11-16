import React from 'react';
import { FUTURISTIC_GLASS_STYLE } from '../constants';

const HowToPage: React.FC = () => {
  return (
    <div className="space-y-6 text-gray-300">
      <div className={`${FUTURISTIC_GLASS_STYLE} p-6 md:p-8`}>
        <h2 className="text-2xl font-bold text-white mb-4">Welcome to Zenith Budget!</h2>
        <p>This guide will help you understand the principles behind the app and how to get started on your journey to financial clarity.</p>
      </div>
      
      <div className={`${FUTURISTIC_GLASS_STYLE} p-6 md:p-8`}>
        <h3 className="text-xl font-bold text-cyan-400 mb-3">The Zero-Based Budgeting Method</h3>
        <p className="mb-4">
          Zenith Budget is built on the <strong className="text-white">zero-based budgeting</strong> method. The concept is simple: <strong className="text-white">give every dollar a job</strong>.
        </p>
        <p className="mb-4">
          At the beginning of each month, you plan where all of your income will go—from bills and expenses to debt payments and savings goals. Your income minus all your planned spending should equal zero.
        </p>
        <div className="bg-gray-900/50 border border-cyan-400/20 rounded-lg p-4">
            <h4 className="font-semibold text-white">The Main Goal: Remaining to Budget = $0</h4>
            <p className="text-sm text-gray-400 mt-1">This is the most important indicator. When it's zero, it means you've created a complete plan for your income. It doesn't mean you have no money left; it means every single dollar has been intentionally allocated.</p>
        </div>
      </div>

      <div className={`${FUTURISTIC_GLASS_STYLE} p-6 md:p-8`}>
        <h3 className="text-xl font-bold text-cyan-400 mb-4">Getting Started: A Step-by-Step Guide</h3>
        <ol className="list-decimal list-inside space-y-6">
          <li>
            <strong className="text-white">Set Up Your Month:</strong>
            <p className="text-sm text-gray-400 ml-6 mt-1">Use the dropdown menu at the top right to create a budget for a new month. You can start from scratch, copy your categories from the previous month with zeroed-out values, or copy the entire budget to save time.</p>
          </li>
          <li>
            <strong className="text-white">Plan Your Budget (The 'Expected' Amount):</strong>
            <p className="text-sm text-gray-400 ml-6 mt-1">For each category (Income, Expenses, Bills, etc.), add subcategories and fill in the <strong className="text-gray-200">'Expected'</strong> amount. This is your plan. How much do you expect to earn? How much do you plan to spend on groceries? Your goal is to keep adjusting these 'Expected' amounts until your "Remaining to Budget" at the top of the screen is $0.</p>
          </li>
          <li>
            <strong className="text-white">Log Transactions (The 'Actual' Amount):</strong>
            <p className="text-sm text-gray-400 ml-6 mt-1">As you go through the month, log every transaction. When you get paid, log it under 'Income'. When you buy something, log it in the appropriate expense category. The app will automatically sum these up as your <strong className="text-gray-200">'Actual'</strong> spending.</p>
          </li>
          <li>
            <strong className="text-white">Track and Adjust:</strong>
            <p className="text-sm text-gray-400 ml-6 mt-1">Use the 'Budget' page to see how your actual spending compares to your expected plan. The progress bars will show you how much of your budget you've used. If you overspend in one area, you'll need to adjust your budget and move money from another category to stay on track. The 'Dashboard' page gives you a high-level visual overview of your financial health.</p>
          </li>
        </ol>
      </div>

       <div className={`${FUTURISTIC_GLASS_STYLE} p-6 md:p-8`}>
        <h3 className="text-xl font-bold text-cyan-400 mb-3">Key Indicators Explained</h3>
        <ul className="space-y-4">
            <li>
                <strong className="text-white">Remaining to Budget:</strong> This shows `Total Expected Income - Total Expected Spending`. It's your planning metric. Aim for $0.
            </li>
            <li>
                <strong className="text-white">Remaining to Spend:</strong> This shows `Total Actual Income - Total Actual Spending`. This is your real-time cash flow for the month.
            </li>
        </ul>
      </div>

    </div>
  );
};

export default HowToPage;