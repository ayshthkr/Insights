import React from 'react';
import { Search } from 'lucide-react';

const AnimatedSearchIcon = ({ streamingStage }: any) => {
  const isSearching = streamingStage?.stage === 'searching';

  return (
    <div className="relative">
      {/* Main container */}
      <div
        className={`
          w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg
          flex items-center justify-center transition-all duration-300 ease-out
          ${isSearching ? 'scale-110 shadow-lg shadow-emerald-500/25' : ''}
        `}
        style={{
          animation: isSearching ? 'searchPulse 1.5s ease-in-out infinite' : 'none'
        }}
      >
        {/* Search icon */}
        <Search
          className={`
            w-4 h-4 text-white transition-all duration-500
            ${isSearching ? 'animate-bounce' : ''}
          `}
          style={{
            transform: isSearching ? 'rotate(15deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s ease'
          }}
        />

        {/* Ripple effects */}
        {isSearching && (
          <>
            <div
              className="absolute inset-0 rounded-lg bg-emerald-400 opacity-30 pointer-events-none"
              style={{
                animation: 'rippleOut 1.5s ease-out infinite'
              }}
            />
            <div
              className="absolute inset-0 rounded-lg bg-emerald-400 opacity-20 pointer-events-none"
              style={{
                animation: 'rippleOut 1.5s ease-out infinite 0.5s'
              }}
            />
          </>
        )}
      </div>

      {/* Orbiting dots */}
      {isSearching && (
        <div className="absolute inset-0 pointer-events-none">
          {[0, 120, 240].map((rotation, index) => (
            <div
              key={index}
              className="absolute w-1 h-1 bg-emerald-400 rounded-full"
              style={{
                animation: `orbitDots 2s linear infinite ${index * 0.3}s`,
                transformOrigin: '16px 16px',
                top: '15px',
                left: '23px'
              }}
            />
          ))}
        </div>
      )}

      {/* Scanning line effect */}
      {isSearching && (
        <div
          className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none"
          style={{
            background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)',
            animation: 'scanLine 2s ease-in-out infinite'
          }}
        />
      )}

      <style jsx>{`
        @keyframes searchPulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
          }
          50% {
            box-shadow: 0 0 0 6px rgba(16, 185, 129, 0);
          }
        }

        @keyframes rippleOut {
          0% {
            transform: scale(1);
            opacity: 0.3;
          }
          100% {
            transform: scale(1.8);
            opacity: 0;
          }
        }

        @keyframes orbitDots {
          0% {
            transform: rotate(0deg) translateX(12px) rotate(0deg);
          }
          100% {
            transform: rotate(360deg) translateX(12px) rotate(-360deg);
          }
        }

        @keyframes scanLine {
          0% {
            transform: translateX(-100%) skewX(-15deg);
          }
          100% {
            transform: translateX(200%) skewX(-15deg);
          }
        }
      `}</style>
    </div>
  );
};

export default AnimatedSearchIcon;
