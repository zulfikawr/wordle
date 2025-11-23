import React from 'react';
import { LetterState, TileData } from '../types';

interface TileProps {
  data: TileData;
  index: number;
  isRevealed: boolean;
}

const Tile: React.FC<TileProps> = ({ data, index, isRevealed }) => {
  const { char, state } = data;

  // Determine background color based on state
  let backBgClass = 'bg-gray-400 dark:bg-neutral-800';
  if (state === LetterState.CORRECT) backBgClass = 'bg-emerald-400 dark:bg-green-600';
  if (state === LetterState.PRESENT) backBgClass = 'bg-amber-300 dark:bg-yellow-500';
  
  // Animation delay based on index for the "wave" effect
  const delayClass = `delay-${Math.min(index * 100, 600)}`;

  // Pop animation for new letters
  const popClass = char && !isRevealed && state === LetterState.INITIAL ? 'animate-pop' : '';

  return (
    <div className={`relative w-12 h-12 sm:w-16 sm:h-16 flip-container`}>
      <div className={`w-full h-full flip-inner ${isRevealed ? 'flipped' : ''} ${delayClass}`}>
        
        {/* Front Face (Input State) */}
        <div className={`absolute w-full h-full flip-front flex items-center justify-center 
                        bg-white dark:bg-black 
                        border-2 border-black dark:border-white
                        shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]
                        text-3xl font-black text-gray-800 dark:text-white select-none ${popClass}`}>
          {char}
        </div>

        {/* Back Face (Result State) */}
        <div className={`absolute w-full h-full flip-back flex items-center justify-center 
                        border-2 border-black dark:border-white
                        shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]
                        text-3xl font-black text-white select-none ${backBgClass}`}>
          {char}
        </div>
        
      </div>
    </div>
  );
};

export default Tile;