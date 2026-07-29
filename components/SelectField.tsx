import React from 'react';
import { SELECT_STYLE } from '../constants';
import ChevronDownIcon from './icons/ChevronDownIcon';

// A <select> that always shows a chevron, so it reads as a dropdown.
//
// `appearance-none` is needed to stop the OS drawing its own inconsistent arrow, but
// on its own it leaves the control looking like a plain text box with no hint that
// it opens. This draws the arrow back, matching the month picker in the nav bar.
const SelectField: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({
  className = '', children, ...props
}) => (
  <div className="relative">
    <select {...props} className={`${SELECT_STYLE} ${className}`}>
      {children}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-black/40">
      <ChevronDownIcon className="w-4 h-4" />
    </div>
  </div>
);

export default SelectField;
