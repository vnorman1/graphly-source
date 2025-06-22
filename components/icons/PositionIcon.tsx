
import React from 'react';
import { IconProps } from '../../types';

interface PositionIconProps extends IconProps {
  rectX: string;
  rectY: string;
}

const PositionIcon: React.FC<PositionIconProps> = ({ className="w-full h-6", rectX, rectY, fill="currentColor" }) => (
  <svg viewBox="0 0 10 10" className={className}>
    <rect x={rectX} y={rectY} width="3" height="3" fill={fill}/>
  </svg>
);
export default PositionIcon;
