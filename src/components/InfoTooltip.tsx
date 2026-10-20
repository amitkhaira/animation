import React, { useState } from 'react';
import { Info } from 'lucide-react';

interface InfoTooltipProps {
  title: string;
  description: string;
  tips?: string[];
  align?: 'left' | 'right' | 'center';
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({
  title,
  description,
  tips = [],
  align = 'left'
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const getAlignmentClass = () => {
    switch (align) {
      case 'right':
        return 'right-0';
      case 'center':
        return 'left-1/2 -translate-x-1/2';
      default:
        return 'left-0';
    }
  };

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="p-1 rounded-full text-studio-muted hover:text-indigo-400 hover:bg-studio-hover transition-colors"
        title="Click or hover to learn what this section does"
      >
        <Info className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
          className={`absolute top-full mt-1.5 z-50 w-72 rounded-xl bg-[#1a1f2c] border border-indigo-500/30 shadow-2xl p-3.5 text-left text-xs pointer-events-auto backdrop-blur-md ${getAlignmentClass()}`}
        >
          <div className="flex items-center space-x-2 mb-1.5 text-indigo-300 font-semibold">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            <span>{title}</span>
          </div>
          <p className="text-gray-300 text-[11px] leading-relaxed mb-2.5">
            {description}
          </p>

          {tips.length > 0 && (
            <div className="border-t border-studio-border/60 pt-2 space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 block mb-1">
                How to make it work best:
              </span>
              {tips.map((tip, idx) => (
                <div key={idx} className="flex items-start space-x-1.5 text-[10px] text-gray-300">
                  <span className="text-indigo-400 font-bold">•</span>
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
