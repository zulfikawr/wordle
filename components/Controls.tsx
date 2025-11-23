import React from 'react';
import { GameStatus } from '../types';

interface ControlsProps {
  status: GameStatus;
  onNext: () => void;
}

const Controls: React.FC<ControlsProps> = ({ status, onNext }) => {
  return (
    <div className="flex justify-center items-center w-full max-w-md px-4 py-2 mb-2 min-h-[50px]">
      
      {/* Status / Play Button */}
      {(status === GameStatus.WON || status === GameStatus.LOST) && (
        <button 
          onClick={onNext}
          className="animate-bounce bg-blue-400 hover:bg-blue-300 dark:bg-black dark:text-white dark:hover:bg-neutral-800 text-white font-bold py-3 px-8 border-2 border-black dark:border-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] active:shadow-none active:translate-y-[3px] active:translate-x-[3px] transition-all uppercase tracking-widest"
        >
          {status === GameStatus.WON ? 'Play Again' : 'Try Again'}
        </button>
      )}
    </div>
  );
};

export default Controls;