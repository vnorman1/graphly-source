
import React from 'react';
import { CheckboxInputProps } from '../types';

const CheckboxInput: React.FC<CheckboxInputProps> = ({ id, label, checked, onChange, className }) => {
  return (
    <div className={`flex items-center ${className}`}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 text-[#FF3B30] border-gray-300 rounded focus:ring-[#FF3B30] focus:ring-offset-1"
      />
      <label htmlFor={id} className="ml-2 block text-sm font-medium text-gray-900">
        {label}
      </label>
    </div>
  );
};

export default CheckboxInput;