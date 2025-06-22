
import React from 'react';
import { SelectInputProps } from '../types';
import InputLabel from './InputLabel';

const SelectInput: React.FC<SelectInputProps> = ({ id, label, value, options, onChange, className }) => {
  return (
    <div className={className}>
      <InputLabel htmlFor={id} text={label} />
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 block w-full p-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF3B30] focus:border-[#FF3B30] text-sm"
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default SelectInput;