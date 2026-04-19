import { useCallback, useState } from 'react';
import { MenuScreen } from './components/MenuScreen';
import { LearnScreen } from './components/LearnScreen';
import { ResultsScreen } from './components/ResultsScreen';
import { DictionaryScreen } from './components/DictionaryScreen';
import { useAudio } from './hooks/useAudio';
import { challenges } from './lib/challenges';
import type { View } from './types';

export default function App() {
  const [view, setView] = useState<View>('menu');
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  const { toneLoaded, audioEnabled, initAudio, toggleAudio, playSfx } = useAudio();

  const startGame = useCallback(async () => {
    await initAudio();
    setChallengeIndex(0);
    setScore(0);
    setCurrentStreak(0);
    setBestStreak(0);
    setView('learn');
  }, [initAudio]);

  const handleNext = useCallback(
    (wasCorrect: boolean) => {
      if (wasCorrect) {
        setScore((s) => s + 1);
        setCurrentStreak((s) => {
          const next = s + 1;
          setBestStreak((b) => Math.max(b, next));
          return next;
        });
      } else {
        setCurrentStreak(0);
      }
      const nextIndex = challengeIndex + 1;
      if (nextIndex >= challenges.length) {
        playSfx('win');
        setView('results');
      } else {
        setChallengeIndex(nextIndex);
      }
    },
    [challengeIndex, playSfx]
  );

  return (
    <div className="min-h-screen bg-slate-100 font-sans flex items-center justify-center sm:p-4">
      {/* Desktop: polished "phone frame" bezel. Mobile: full viewport. */}
      <div className="bg-white w-full h-[100dvh] sm:h-auto sm:max-h-[95vh] sm:max-w-md sm:rounded-[3rem] sm:shadow-xl sm:border-8 sm:border-slate-200 sm:aspect-[9/16] flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-col p-4 sm:p-6 min-h-0">
          {view === 'menu' && (
            <MenuScreen
              audioEnabled={audioEnabled}
              toneLoaded={toneLoaded}
              onStart={startGame}
              onStudy={() => setView('study')}
            />
          )}
          {view === 'learn' && (
            <LearnScreen
              challenge={challenges[challengeIndex]}
              challengeIndex={challengeIndex}
              totalChallenges={challenges.length}
              score={score}
              streak={currentStreak}
              audioEnabled={audioEnabled}
              onToggleAudio={toggleAudio}
              onExit={() => setView('menu')}
              onNext={handleNext}
              playSfx={playSfx}
            />
          )}
          {view === 'results' && (
            <ResultsScreen
              score={score}
              total={challenges.length}
              streak={bestStreak}
              audioEnabled={audioEnabled}
              onToggleAudio={toggleAudio}
              onRestart={startGame}
              onMenu={() => setView('menu')}
              playSfx={playSfx}
            />
          )}
          {view === 'study' && (
            <DictionaryScreen onBack={() => setView('menu')} playSfx={playSfx} />
          )}
        </div>
      </div>
    </div>
  );
}
