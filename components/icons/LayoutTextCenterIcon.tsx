
import React from 'react';
import { IconProps } from '../../types';

const LayoutTextCenterIcon: React.FC<IconProps> = ({ className="w-full h-10", stroke="currentColor" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round">
    <path d="M8 6h8M6 12h12M8 18h8"></path>
  </svg>
);
export default LayoutTextCenterIcon;
