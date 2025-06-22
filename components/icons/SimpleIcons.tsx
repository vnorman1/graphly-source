import React from 'react';
import { IconProps } from '../../types'; // Assuming IconProps is defined in types

export const EyeIcon: React.FC<IconProps> = ({ className = "w-5 h-5", stroke = "currentColor", ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={stroke} className={className} {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

export const EyeSlashIcon: React.FC<IconProps> = ({ className = "w-5 h-5", stroke = "currentColor", ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={stroke} className={className} {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.15 10.15 0 001.936 12c1.882 3.868 5.264 6.5 9.064 6.5 1.565 0 3.054-.426 4.368-1.182m2.414-2.414a10.124 10.124 0 001.822-4.755C20.255 7.042 16.59 4.5 12.001 4.5c-1.398 0-2.73.29-3.962.825m0 0L3.04 3.041M3.98 8.223L19.5 19.5M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
     <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322L19.5 19.5M3.98 8.223L3.04 3.041" /> {/* Re-draw slash for better visibility */}

  </svg>
);

export const TrashIcon: React.FC<IconProps> = ({ className = "w-5 h-5", stroke = "currentColor", ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={stroke} className={className} {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.56 0c1.153 0 2.242.078 3.324.214M9.354 5.965v-.93A1.875 1.875 0 0111.226 3h1.548A1.875 1.875 0 0114.646 5.035v.93" />
  </svg>
);

export const ArrowUpIcon: React.FC<IconProps> = ({ className = "w-5 h-5", stroke = "currentColor", ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={stroke} className={className} {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
  </svg>
);

export const ArrowDownIcon: React.FC<IconProps> = ({ className = "w-5 h-5", stroke = "currentColor", ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={stroke} className={className} {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
);

export const PlusIcon: React.FC<IconProps> = ({ className = "w-5 h-5", stroke = "currentColor", ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={stroke} className={className} {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

export const TextIcon: React.FC<IconProps> = ({ className = "w-5 h-5", fill = "currentColor", ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill={fill} className={className} {...props}>
    <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-3.5a.75.75 0 000 1.5h3.5v4.5a.75.75 0 001.5 0v-4.5h3.5a.75.75 0 000-1.5h-3.5v-4.5z" />
    <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5v-13A1.5 1.5 0 0015.5 2h-11zM5 3.5a.5.5 0 01.5-.5h1V5H5V3.5zM5 7h10V5.75H6.5V6.5H5V7zm0 1.75V10H6V8.75H5zm1.5 0H15V10H6.5V8.75zm0 2.5V13H15v-1.75H6.5zm-1.5 0H6v1.25H5v-1.25zM15 14.25H5V15h2.25v.5H15v-.5h-2.25V15H15v-.75zm0 2.25h-1V16H6v.5H5v.5A.5.5 0 005.5 17h9a.5.5 0 00.5-.5V16.5z" clipRule="evenodd" />
  </svg>
);

export const ImageIcon: React.FC<IconProps> = ({ className = "w-5 h-5", fill = "currentColor", ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill={fill} className={className} {...props}>
    <path fillRule="evenodd" d="M1 5.25A2.25 2.25 0 013.25 3h13.5A2.25 2.25 0 0119 5.25v9.5A2.25 2.25 0 0116.75 17H3.25A2.25 2.25 0 011 14.75v-9.5zm1.5 0A.75.75 0 013.25 4.5h13.5A.75.75 0 0117.5 5.25v9.5A.75.75 0 0116.75 15.5H3.25A.75.75 0 012.5 14.75v-9.5zm4.502 3.03a.75.75 0 00-1.06 1.06l3 3a.75.75 0 101.06-1.06l-3-3z" clipRule="evenodd" />
    <path fillRule="evenodd" d="M10.232 10.468a.75.75 0 00-1.06-1.06l-3 3a.75.75 0 101.06 1.06l3-3z" clipRule="evenodd" />
    <path fillRule="evenodd" d="M12.25 9a1.25 1.25 0 100-2.5 1.25 1.25 0 000 2.5z" clipRule="evenodd" />
  </svg>
);

export const LogoIcon: React.FC<IconProps> = ({ className = "w-5 h-5", fill = "currentColor", ...props }) => ( // Placeholder icon
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill={fill} className={className} {...props}>
    <path d="M6.5 3.5A1.5 1.5 0 005 5v2.875A1.5 1.5 0 006.5 9.5h1A1.5 1.5 0 009 7.875V5a1.5 1.5 0 00-1.5-1.5h-1zM10 5a1.5 1.5 0 00-1.5 1.5v1.25A1.5 1.5 0 0010 9.25h3.5a1.5 1.5 0 001.5-1.5V6.5A1.5 1.5 0 0013.5 5h-3.5zM5 11.5A1.5 1.5 0 016.5 10h3.25a1.5 1.5 0 011.5 1.5v3A1.5 1.5 0 019.75 16H6.5A1.5 1.5 0 015 14.5v-3z" />
  </svg>
);
