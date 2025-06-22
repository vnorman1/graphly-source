import React from 'react';
import { BRAND_RED } from '../constants';

const GRID_SIZE = 5; // 5x5 grid
const GRID_LENGTH = 64;
const CELL_SIZE = GRID_LENGTH / (GRID_SIZE - 1);

const Preloader: React.FC = () => {
  // SVG grid lines (vertical & horizontal)
  const lines: JSX.Element[] = [];
  for (let i = 0; i < GRID_SIZE; i++) {
    // vertical
    lines.push(
      <line
        key={`v-${i}`}
        x1={i * CELL_SIZE}
        y1={0}
        x2={i * CELL_SIZE}
        y2={GRID_LENGTH}
        stroke={i === 2 ? BRAND_RED : '#bbb'}
        strokeWidth={i === 2 ? 2.5 : 1.5}
        strokeDasharray="2 4"
        className={`preloader-grid-line preloader-v preloader-v${i}`}
      />
    );
    // horizontal
    lines.push(
      <line
        key={`h-${i}`}
        x1={0}
        y1={i * CELL_SIZE}
        x2={GRID_LENGTH}
        y2={i * CELL_SIZE}
        stroke={i === 2 ? BRAND_RED : '#bbb'}
        strokeWidth={i === 2 ? 2.5 : 1.5}
        strokeDasharray="2 4"
        className={`preloader-grid-line preloader-h preloader-h${i}`}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90">
      <div className="flex flex-col items-center gap-6">
        <div className="relative w-20 h-20">
          <svg viewBox="0 0 64 64" width="80" height="80" className="block">
            {lines}
          </svg>
          <style>{`
            .preloader-grid-line {
              opacity: 0;
              transform: scaleY(0.2) scaleX(0.2);
              transform-box: fill-box;
              transform-origin: center;
              transition: none;
            }
            .preloader-v0, .preloader-h0 {
              animation: grid-in 1.1s cubic-bezier(.6,0,.4,1) 0.05s infinite alternate;
            }
            .preloader-v1, .preloader-h1 {
              animation: grid-in 1.1s cubic-bezier(.6,0,.4,1) 0.15s infinite alternate;
            }
            .preloader-v2, .preloader-h2 {
              animation: grid-in-red 1.1s cubic-bezier(.6,0,.4,1) 0.25s infinite alternate;
            }
            .preloader-v3, .preloader-h3 {
              animation: grid-in 1.1s cubic-bezier(.6,0,.4,1) 0.35s infinite alternate;
            }
            .preloader-v4, .preloader-h4 {
              animation: grid-in 1.1s cubic-bezier(.6,0,.4,1) 0.45s infinite alternate;
            }
            @keyframes grid-in {
              0% { opacity: 0; transform: scaleY(0.2) scaleX(0.2); }
              40% { opacity: 1; transform: scaleY(1.1) scaleX(1.1); }
              60% { opacity: 1; transform: scaleY(1) scaleX(1); }
              100% { opacity: 0; transform: scaleY(0.2) scaleX(0.2); }
            }
            @keyframes grid-in-red {
              0% { opacity: 0; transform: scaleY(0.2) scaleX(0.2); }
              30% { opacity: 1; transform: scaleY(1.2) scaleX(1.2); }
              60% { opacity: 1; transform: scaleY(1) scaleX(1); }
              100% { opacity: 0; transform: scaleY(0.2) scaleX(0.2); }
            }
          `}</style>
        </div>
        <span className="text-lg font-black tracking-tight uppercase text-gray-900" style={{letterSpacing: '0.08em'}}>GRAPHLY</span>
      </div>
    </div>
  );
};

export default Preloader;
