
import React from 'react';
import { IconButtonProps } from '../types';

const IconButton: React.FC<IconButtonProps> = ({ onClick, title, isActive, children, className = "p-2" }) => {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`border-2 bg-white rounded-md transition-all duration-200 focus:outline-none ${className} ${
        isActive ? 'border-[#FF3B30] shadow-[0_0_0_2px_rgba(255,59,48,0.4)]' : 'border-gray-300 hover:border-gray-400'
      }`}
    >
      {children}
    </button>
  );
};

export default IconButton;
