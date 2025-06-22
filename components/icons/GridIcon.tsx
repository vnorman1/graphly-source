import React from 'react';

const GridIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="3" y="3" width="18" height="18" rx="3" strokeDasharray="2 2" />
    <line x1="3" y1="8.5" x2="21" y2="8.5" strokeDasharray="2 2" />
    <line x1="3" y1="15.5" x2="21" y2="15.5" strokeDasharray="2 2" />
    <line x1="8.5" y1="3" x2="8.5" y2="21" strokeDasharray="2 2" />
    <line x1="15.5" y1="3" x2="15.5" y2="21" strokeDasharray="2 2" />
  </svg>
);

export default GridIcon;
