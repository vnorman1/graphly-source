import React from 'react';
import { IconProps } from '../../types';

const LayoutTextRightIcon: React.FC<IconProps> = ({ className = "w-full h-10", stroke = "currentColor" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round">
    <path d="M12 6h8M10 12h10M14 18h6"></path> {/* Adjusted paths for right alignment visual */}
  </svg>
);
export default LayoutTextRightIcon;