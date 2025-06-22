import React from 'react';
import { ControlPanelSectionProps } from '../types';

const ControlPanelSection: React.FC<ControlPanelSectionProps> = ({ title, isOpenDefault = false, children, className }) => {
  return (
    <details className={`control-panel group border-b-2 border-gray-200 ${className}`} open={isOpenDefault}>
      <summary className={`list-none flex justify-between items-center py-4 cursor-pointer text-xl font-black text-gray-900 hover:text-[#FF3B30] transition-colors duration-200 group-open:bg-gray-100 group-open:rounded-t-md px-2 group-open:px-2 -mx-2 group-open:mx-0`}>
        <span className="group-open:ml-2 transition-all duration-300">{title}</span>
        <span className="text-3xl font-light text-gray-700 group-open:rotate-45 transition-transform duration-300 group-hover:text-[#FF3B30] group-open:mr-2">
          +
        </span>
      </summary>
      <div className="group-open:border-t group-open:border-gray-200 group-open:bg-gray-50/70 group-open:rounded-b-md p-4 space-y-6">
        {children}
      </div>
    </details>
  );
};

export default ControlPanelSection;