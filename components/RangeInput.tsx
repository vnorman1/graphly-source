
import React from 'react';
import { RangeInputProps } from '../types';
import InputLabel from './InputLabel';

const RangeInput: React.FC<RangeInputProps> = ({ id, label, min, max, step = 1, value, onChange, valueSuffix = '', valueDisplay: customValueDisplay }) => {
  const displayValue = customValueDisplay !== undefined ? customValueDisplay : `${value}${valueSuffix}`;
  return (
    <div>
      <InputLabel htmlFor={id} text={label} valueDisplay={displayValue} />
      <input
        type="range"
        id={id}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="mt-2 w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer focus:outline-none accent-[#FF3B30]"
      />
    </div>
  );
};

export default RangeInput;
