import React from 'react';
import { TwitterPreviewCardProps } from '../types';

const TwitterPreviewCard: React.FC<TwitterPreviewCardProps> = ({ imageUrl, headlineContent }) => {
  if (!imageUrl) {
    return null;
  }
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 w-full md:max-w-sm shadow-lg flex-1 min-w-[300px]">
      <div className="flex items-center mb-2">
        <div className="w-10 h-10 rounded-full bg-gray-300 mr-3"></div>
        <div>
          <div className="font-bold text-sm text-gray-900">Your Brand</div>
          <div className="text-xs text-gray-500">@yourbrand</div>
        </div>
      </div>
      {imageUrl && (
        <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden aspect-[1.91/1]">
          <img src={imageUrl} alt="Twitter OG Kép előnézete" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="mt-2 text-gray-800">
        <p className="text-sm leading-snug">
            {headlineContent || 'Izgatottan jelentjük be legújabb cikkünket! 🚀 Olvasd el, hogyan forradalmasítjuk a produktivitást.'}
        </p>
      </div>
    </div>
  );
};

export default TwitterPreviewCard;
