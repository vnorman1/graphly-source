import React from 'react';
import { FacebookPreviewCardProps } from '../types';

const FacebookPreviewCard: React.FC<FacebookPreviewCardProps> = ({ imageUrl, headlineContent, siteName }) => {
  if (!imageUrl) {
    return null;
  }
  return (
    <div className="bg-white border border-gray-300 rounded-lg w-full md:max-w-sm shadow-lg flex-1 min-w-[300px]">
      {imageUrl && (
        <div className="border-b border-gray-300 aspect-[1.91/1]">
          <img src={imageUrl} alt="Facebook OG Kép előnézete" className="w-full h-full object-cover rounded-t-lg" />
        </div>
      )}
      <div className="p-3 bg-gray-50 rounded-b-lg">
        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">{siteName}</div>
        <h3 className="font-semibold text-gray-900 leading-tight text-base">
          {headlineContent || 'Lenyűgöző új tartalom, amit látnod kell!'}
        </h3>
        {/* Potenciális leírás helye, ha szükséges lenne:
        <p className="text-sm text-gray-600 mt-1">
          Rövid leírás a tartalomról, amely tovább ösztönzi a kattintást.
        </p>
        */}
      </div>
    </div>
  );
};

export default FacebookPreviewCard;
