import React from 'react';
import { LetterState } from '../types';

interface KeyboardProps {
  onKey: (key: string) => void;
  onEnter: () => void;
  onDelete: () => void;
  letterStates: Record<string, LetterState>;
  disabled: boolean;
}

const KEYS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'DEL'],
];

const Keyboard: React.FC<KeyboardProps> = ({ onKey, onEnter, onDelete, letterStates, disabled }) => {
  
  const getKeyColor = (key: string) => {
    const state = letterStates[key];
    if (state === LetterState.CORRECT) return 'bg-emerald-400 dark:bg-green-600 text-white border-black dark:border-white';
    if (state === LetterState.PRESENT) return 'bg-amber-300 dark:bg-yellow-500 text-white border-black dark:border-white';
    if (state === LetterState.ABSENT) return 'bg-gray-400 dark:bg-neutral-900 text-white opacity-50 border-black dark:border-neutral-700';
    
    // Default Key
    return 'bg-white dark:bg-black text-gray-800 dark:text-white hover:bg-rose-100 dark:hover:bg-neutral-800 border-black dark:border-white';
  };

  const handlePress = (key: string) => {
    if (disabled) return;
    if (key === 'ENTER') onEnter();
    else if (key === 'DEL') onDelete();
    else onKey(key);
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-2 pb-8">
      <div className="flex flex-col gap-2 select-none">
        {KEYS.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center gap-1 sm:gap-2">
            {row.map((key) => (
              <button
                key={key}
                onClick={() => handlePress(key)}
                disabled={disabled}
                className={`
                  pressable
                  h-12 sm:h-14 
                  font-bold text-sm sm:text-lg border-2
                  shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]
                  active:shadow-none
                  transition-colors duration-200
                  flex items-center justify-center
                  ${key === 'ENTER' || key === 'DEL' ? 'w-16 sm:w-20 px-1' : 'w-8 sm:w-12'}
                  ${getKeyColor(key)}
                  ${disabled ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}
                `}
              >
                {key === 'DEL' ? (
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                   <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75L14.25 12m0 0l2.25 2.25M14.25 12l2.25-2.25M14.25 12L12 14.25m-2.58 4.92l-6.375-6.375a1.125 1.125 0 010-1.59L9.42 4.83c.211-.211.498-.33.796-.33H19.5a2.25 2.25 0 012.25 2.25v10.5a2.25 2.25 0 01-2.25 2.25h-9.284c-.298 0-.585-.119-.796-.33z" />
                 </svg>                 
                ) : key}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Keyboard;