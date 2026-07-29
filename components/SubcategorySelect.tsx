import React, { useState } from 'react';
import type { Subcategory } from '../types';
import { INPUT_STYLE } from '../constants';
import SelectField from './SelectField';

const SENTINEL = '__CREATE_NEW__';

interface SubcategorySelectProps {
  id?: string;
  value: string;
  onChange: (name: string) => void;
  options: Subcategory[];   // the current category's subcategories
  required?: boolean;
}

// A real <select> plus a "create new" escape hatch, deliberately NOT an
// <input list> + <datalist>. Datalist renders no dropdown on iOS Safari and only
// leaks options into the keyboard's suggestion strip on Android, so on a phone the
// picker looked broken. A native select gets the platform's own picker for free.
//
// Remount this (via a `key` on the category) to reset it when the category changes.
const SubcategorySelect: React.FC<SubcategorySelectProps> = ({ id, value, onChange, options, required }) => {
  const [isCreating, setIsCreating] = useState(false);

  if (isCreating) {
    return (
      <div className="space-y-2">
        <input
          type="text"
          id={id}
          value={value}
          onChange={e => onChange(e.target.value)}
          required={required}
          autoFocus
          placeholder="New subcategory name"
          className={INPUT_STYLE}
        />
        <button
          type="button"
          onClick={() => { setIsCreating(false); onChange(''); }}
          className="text-xs text-green-accent hover:text-sb-green"
        >
          Cancel
        </button>
      </div>
    );
  }

  // A value that isn't in `options` still needs an option to sit in, or the select
  // would silently snap to something else — e.g. editing a recurring rule whose
  // subcategory the currently selected month doesn't have.
  const isKnown = options.some(o => o.name === value);

  return (
    <SelectField
      id={id}
      value={value}
      onChange={e => {
        if (e.target.value === SENTINEL) {
          setIsCreating(true);
          onChange('');
        } else {
          onChange(e.target.value);
        }
      }}
      required={required}
    >
      <option value="" disabled>Select or create...</option>
      {!isKnown && value && <option value={value}>{value}</option>}
      {options.map(sub => (
        <option key={sub.id} value={sub.name}>{sub.name}</option>
      ))}
      <option value={SENTINEL} className="italic text-green-accent font-semibold bg-white">
        -- Create New --
      </option>
    </SelectField>
  );
};

export default SubcategorySelect;
