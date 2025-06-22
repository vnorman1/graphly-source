
import React from 'react';
import { ColorPickerInputProps } from '../types';
import InputLabel from './InputLabel';

const ColorPickerInput: React.FC<ColorPickerInputProps> = ({ id, label, value, onChange }) => {
  return (
    <div>
      <InputLabel htmlFor={id} text={label} />
      <input
        type="color"
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full h-12 p-1 border border-gray-300 rounded-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FF3B30] focus:border-[#FF3B30]"
      />
    </div>
  );
};

export default ColorPickerInput;
