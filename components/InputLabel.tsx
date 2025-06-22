
import React from 'react';
import { InputLabelProps } from '../types';

const InputLabel: React.FC<InputLabelProps> = ({ htmlFor, text, valueDisplay, className }) => {
  return (
    <label htmlFor={htmlFor} className={`block text-xs font-bold text-gray-900 uppercase tracking-wider ${className}`}>
      <div className="flex justify-between items-center">
        <span>{text}</span>
        {valueDisplay && <span className="font-bold text-gray-800 normal-case">{valueDisplay}</span>}
      </div>
    </label>
  );
};

export default InputLabel;