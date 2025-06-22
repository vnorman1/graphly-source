
import React from 'react';
import { IconProps } from '../../types';

const LayoutTextLeftIcon: React.FC<IconProps> = ({ className="w-full h-10", stroke="currentColor" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round">
    <path d="M4 6h8M4 12h12M4 18h6"></path>
  </svg>
);
export default LayoutTextLeftIcon;
