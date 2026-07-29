import React from 'react';
import { useSettings, CURRENCIES, CurrencyCode } from '../contexts/SettingsContext';
import { CARD_STYLE } from '../constants';
import SelectField from '../components/SelectField';
import type { useRecurring } from '../hooks/useRecurring';
import type { Subcategories } from '../types';
import RecurringRulesCard from '../components/RecurringRulesCard';

type SettingsPageProps = ReturnType<typeof useRecurring> & { subcategories: Subcategories };

const SettingsPage: React.FC<SettingsPageProps> = ({
  rules, addRule, updateRule, deleteRule, toggleRuleActive, subcategories,
}) => {
  const { currency, setCurrency } = useSettings();

  return (
    <div className="space-y-6">
      <div className={`${CARD_STYLE} p-6`}>
        <h2 className="text-xl font-bold text-black/87 mb-4">General Settings</h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="currency-select" className="block text-sm font-medium text-black/70 mb-2">
              Currency
            </label>
            <div className="md:w-64">
              <SelectField
                id="currency-select"
                value={currency.code}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name} ({c.symbol})
                  </option>
                ))}
              </SelectField>
            </div>
            <p className="mt-2 text-sm text-black/60">
              Select the currency you want to use for your budget.
            </p>
          </div>
        </div>
      </div>

      <RecurringRulesCard
        rules={rules}
        addRule={addRule}
        updateRule={updateRule}
        deleteRule={deleteRule}
        toggleRuleActive={toggleRuleActive}
        subcategories={subcategories}
      />
    </div>
  );
};

export default SettingsPage;
