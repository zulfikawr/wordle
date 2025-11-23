import React, { useState, useEffect, useCallback } from 'react';
import Grid from './components/Grid';
import Keyboard from './components/Keyboard';
import Controls from './components/Controls';
import { fetchRandomWord, validateWordExistence } from './services/gemini';
import { GameStatus, LetterState, GridData } from './types';
import confetti from 'canvas-confetti';

// Constants
const MAX_GUESSES = 5;
const WORD_LENGTH = 5;

const App: React.FC = () => {
  // --- State ---
  const [secretWord, setSecretWord] = useState('');
  const [grid, setGrid] = useState<GridData>([]);
  const [currentRow, setCurrentRow] = useState(0);
  const [currentCol, setCurrentCol] = useState(0);
  const [gameStatus, setGameStatus] = useState<GameStatus>(GameStatus.LOADING);
  const [shakeRow, setShakeRow] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Derived state for keyboard coloring
  const [letterStates, setLetterStates] = useState<Record<string, LetterState>>({});

  // --- Initialization ---

  const initGame = useCallback(async () => {
    setGameStatus(GameStatus.LOADING);
    setMessage(null);
    setCurrentRow(0);
    setCurrentCol(0);
    setShakeRow(false);
    setLetterStates({});
    
    // Create empty grid
    const newGrid: GridData = Array(MAX_GUESSES).fill(null).map(() => 
      Array(WORD_LENGTH).fill(null).map(() => ({ char: '', state: LetterState.INITIAL }))
    );
    setGrid(newGrid);

    // Fetch word
    const word = await fetchRandomWord(WORD_LENGTH);
    setSecretWord(word);
    setGameStatus(GameStatus.PLAYING);
  }, []);

  // Initial load
  useEffect(() => {
    initGame();
  }, [initGame]);

  // --- Logic ---

  const handleKeyInput = useCallback((key: string) => {
    if (gameStatus !== GameStatus.PLAYING) return;
    if (currentCol >= WORD_LENGTH) return;

    setGrid(prev => {
      const newGrid = [...prev];
      // Create shallow copy of row to mutate
      const newRow = [...newGrid[currentRow]];
      newRow[currentCol] = { char: key, state: LetterState.INITIAL };
      newGrid[currentRow] = newRow;
      return newGrid;
    });
    setCurrentCol(prev => prev + 1);
  }, [gameStatus, currentCol, currentRow]);

  const handleDelete = useCallback(() => {
    if (gameStatus !== GameStatus.PLAYING) return;
    if (currentCol <= 0) return;

    setGrid(prev => {
      const newGrid = [...prev];
      const newRow = [...newGrid[currentRow]];
      newRow[currentCol - 1] = { char: '', state: LetterState.INITIAL };
      newGrid[currentRow] = newRow;
      return newGrid;
    });
    setCurrentCol(prev => prev - 1);
  }, [gameStatus, currentCol, currentRow]);

  const handleEnter = useCallback(async () => {
    if (gameStatus !== GameStatus.PLAYING) return;
    
    if (currentCol < WORD_LENGTH) {
      setShakeRow(true);
      setMessage("Too short");
      setTimeout(() => { setShakeRow(false); setMessage(null); }, 500);
      return;
    }

    // Build the guessed word
    const currentGuess = grid[currentRow].map(t => t.char).join('');

    // Quick Validation using Gemini
    setGameStatus(GameStatus.VALIDATING);
    const isValid = await validateWordExistence(currentGuess);
    
    if (!isValid) {
        setGameStatus(GameStatus.PLAYING);
        setShakeRow(true);
        setMessage("Not a valid word");
        setTimeout(() => { setShakeRow(false); setMessage(null); }, 1000);
        return;
    }

    // Proceed to check against secret word
    const newGrid = [...grid];
    const secretArr = secretWord.split('');
    const guessArr = currentGuess.split('');
    const rowTiles = newGrid[currentRow].map(t => ({...t})); // Deep copy tiles for state update

    // First pass: Correct (Green)
    guessArr.forEach((char, i) => {
        if (char === secretArr[i]) {
            rowTiles[i].state = LetterState.CORRECT;
            secretArr[i] = ''; // Mark as used
            guessArr[i] = ''; // Mark as handled
        }
    });

    // Second pass: Present (Yellow) or Absent (Gray)
    rowTiles.forEach((tile, i) => {
       if (tile.state !== LetterState.CORRECT) {
           const char = tile.char;
           const indexInSecret = secretArr.indexOf(char);
           if (indexInSecret !== -1) {
               tile.state = LetterState.PRESENT;
               secretArr[indexInSecret] = ''; // Mark used
           } else {
               tile.state = LetterState.ABSENT;
           }
       }
    });

    newGrid[currentRow] = rowTiles;
    setGrid(newGrid);

    // Update keyboard states
    setLetterStates(prev => {
        const next = { ...prev };
        rowTiles.forEach(tile => {
            const currentState = next[tile.char];
            // Upgrade state logic: Initial < Absent < Present < Correct
            if (tile.state === LetterState.CORRECT) {
                next[tile.char] = LetterState.CORRECT;
            } else if (tile.state === LetterState.PRESENT && currentState !== LetterState.CORRECT) {
                next[tile.char] = LetterState.PRESENT;
            } else if (tile.state === LetterState.ABSENT && !currentState) {
                next[tile.char] = LetterState.ABSENT;
            }
        });
        return next;
    });

    // Check Win/Loss
    if (currentGuess === secretWord) {
        setGameStatus(GameStatus.WON);
        setMessage("SPLENDID");
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#34d399', '#fcd34d', '#f87171', '#60a5fa'] // Pastel-ish confetti
        });
    } else if (currentRow === MAX_GUESSES - 1) {
        setGameStatus(GameStatus.LOST);
        setMessage(secretWord); // Show the word
    } else {
        setGameStatus(GameStatus.PLAYING);
        setCurrentRow(prev => prev + 1);
        setCurrentCol(0);
    }

  }, [gameStatus, currentCol, grid, currentRow, secretWord]);

  // Physical Keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        
        const key = e.key.toUpperCase();
        
        if (key === 'ENTER') {
            // Feature: Restart game on Enter if Won/Lost
            if (gameStatus === GameStatus.WON || gameStatus === GameStatus.LOST) {
                initGame();
                return;
            }
            handleEnter();
        } 
        else if (key === 'BACKSPACE') handleDelete();
        else if (/^[A-Z]$/.test(key)) handleKeyInput(key);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleEnter, handleDelete, handleKeyInput, gameStatus, initGame]);


  // --- Render ---

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen flex flex-col items-center justify-between bg-orange-50 dark:bg-black text-gray-800 dark:text-white font-sans overflow-hidden select-none transition-colors duration-300">
        
        {/* Header */}
        <header className="pt-8 pb-2 text-center w-full relative">
            <h1 className="text-4xl sm:text-5xl font-black tracking-[0.2em] uppercase">
            WORDLE
            </h1>
            <p className="text-xs font-bold text-gray-400 dark:text-gray-500 mt-2 uppercase tracking-[0.2em]">
                {gameStatus === GameStatus.LOADING ? 'LOADING...' : `GUESSES LEFT: ${MAX_GUESSES - currentRow}`}
            </p>

            {/* Dark Mode Toggle */}
            <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="absolute top-6 right-4 sm:top-8 sm:right-8 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white dark:bg-black text-gray-800 dark:text-white border-2 border-black dark:border-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] active:shadow-none active:translate-x-[3px] active:translate-y-[3px] transition-all duration-200 hover:bg-rose-100 dark:hover:bg-neutral-900"
                aria-label="Toggle Dark Mode"
            >
                {isDarkMode ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                    </svg>
                )}
            </button>
        </header>

        {/* Game Area */}
        <main className="flex-grow flex flex-col items-center justify-center w-full max-w-2xl relative mb-8">
            
            <Controls 
                status={gameStatus} 
                onNext={initGame}
            />
            
            {/* Toast Message */}
            <div className={`
                absolute top-20 z-20 pointer-events-none transition-all duration-300 transform
                ${message ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'}
            `}>
            <div className="bg-black dark:bg-black text-white dark:text-white px-6 py-4 font-bold text-xl shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] border-2 border-white dark:border-white tracking-widest uppercase">
                {message}
            </div>
            </div>

            <Grid 
            grid={grid} 
            currentRow={currentRow} 
            shakeRow={shakeRow} 
            />

            {gameStatus === GameStatus.LOADING && (
                <div className="absolute inset-0 flex items-center justify-center bg-orange-50/80 dark:bg-black/80 z-10 backdrop-blur-sm transition-colors duration-300">
                    <div className="flex flex-col items-center gap-4">
                        <div className="animate-spin h-10 w-10 border-4 border-gray-300 border-t-black dark:border-neutral-800 dark:border-t-white"></div>
                    </div>
                </div>
            )}
        </main>

        {/* Keyboard */}
        <footer className="w-full pb-8 sm:pb-12 pt-4">
            <Keyboard 
                onKey={handleKeyInput} 
                onEnter={handleEnter} 
                onDelete={handleDelete} 
                letterStates={letterStates}
                disabled={gameStatus !== GameStatus.PLAYING}
            />
        </footer>

      </div>
    </div>
  );
};

export default App;