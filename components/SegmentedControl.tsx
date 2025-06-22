
import React from 'react';
import { SegmentedControlProps, SegmentedControlOption } from '../types';
import InputLabel from './InputLabel'; // Optional: if you want a main label above the control

const SegmentedControl = <T extends string>({
  label,
  options,
  value,
  onChange,
  name,
}: SegmentedControlProps<T>) => {
  return (
    <div>
      {label && <InputLabel text={label} className="mb-1" />}
      <div className="flex w-full p-0.5 bg-gray-200 rounded-lg">
        {options.map((option: SegmentedControlOption<T>) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`flex-1 py-2 px-3 text-center text-sm font-medium rounded-md transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF3B30] focus-visible:ring-offset-1 focus-visible:ring-offset-gray-200
              ${
                value === option.value
                  ? 'bg-white text-[#FF3B30] shadow-sm'
                  : 'bg-transparent text-gray-600 hover:bg-gray-300/70'
              }
            `}
            aria-pressed={value === option.value}
          >
            {option.icon && <span className="mr-2">{option.icon}</span>}
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SegmentedControl;