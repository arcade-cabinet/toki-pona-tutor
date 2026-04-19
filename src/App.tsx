import { useCallback, useEffect, useState } from 'react';
import { MenuScreen } from './components/MenuScreen';
import { LearnScreen } from './components/LearnScreen';
import { ResultsScreen } from './components/ResultsScreen';
import { DictionaryScreen } from './components/DictionaryScreen';
import { AdventureView } from './components/AdventureView';
import { useAudio } from './hooks/useAudio';
import { challenges } from './lib/challenges';
import type { View } from './types';

const STARTING_HEARTS = 3;
const XP_PER_CORRECT = 10;
const XP_STREAK_BONUS = 5;
const XP_PER_LEVEL = 50;

export default function App() {
  const [view, setView] = useState<View>('menu');
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [hearts, setHearts] = useState(STARTING_HEARTS);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const { toneLoaded, audioEnabled, initAudio, toggleAudio, playSfx, playBgm } = useAudio();

  useEffect(() => {
    if (!audioEnabled) return;
    if (view === 'menu' || view === 'study') playBgm('menu');
    else if (view === 'learn') playBgm('lesson');
    else if (view === 'results') playBgm(gameOver ? 'gameover' : 'results');
  }, [view, audioEnabled, playBgm, gameOver]);

  const startGame = useCallback(async () => {
    await initAudio();
    setChallengeIndex(0);
    setScore(0);
    setHearts(STARTING_HEARTS);
    setXp(0);
    setLevel(1);
    setCurrentStreak(0);
    setBestStreak(0);
    setGameOver(false);
    setView('learn');
  }, [initAudio]);

  const handleAnswer = useCallback(
    (wasCorrect: boolean) => {
      if (wasCorrect) {
        setScore((s) => s + 1);
        const newStreak = currentStreak + 1;
        setCurrentStreak(newStreak);
        setBestStreak((b) => Math.max(b, newStreak));
        const xpEarned = XP_PER_CORRECT + (newStreak >= 2 ? XP_STREAK_BONUS : 0);
        setXp((prev) => {
          const next = prev + xpEarned;
          if (next >= XP_PER_LEVEL) {
            setLevel((l) => l + 1);
            return next - XP_PER_LEVEL;
          }
          return next;
        });
      } else {
        setCurrentStreak(0);
        setHearts((h) => {
          const next = h - 1;
          if (next <= 0) setGameOver(true);
          return next;
        });
      }
    },
    [currentStreak]
  );

  const handleNext = useCallback(() => {
    if (gameOver) {
      playSfx('win');
      setView('results');
      return;
    }
    const nextIndex = challengeIndex + 1;
    if (nextIndex >= challenges.length) {
      playSfx('win');
      setView('results');
    } else {
      setChallengeIndex(nextIndex);
    }
  }, [gameOver, challengeIndex, playSfx]);

  return (
    <div className="min-h-screen bg-sunset flex items-center justify-center sm:p-4">
      <div className={`w-full h-[100dvh] flex flex-col overflow-hidden ${
        view === 'adventure'
          ? 'bg-[#1b3e2f] sm:h-auto sm:max-h-[96vh] sm:max-w-[1280px] sm:aspect-video sm:rounded-3xl sm:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)]'
          : 'bg-sunset-deep sm:h-auto sm:max-h-[95vh] sm:max-w-md sm:rounded-[3rem] sm:shadow-2xl sm:border-[6px] sm:border-white/40 sm:aspect-[9/16]'
      }`}>
        <div className="flex-1 flex flex-col p-4 sm:p-6 min-h-0 text-slate-900">
          {view === 'menu' && (
            <MenuScreen
              audioEnabled={audioEnabled}
              toneLoaded={toneLoaded}
              onStart={startGame}
              onAdventure={() => setView('adventure')}
              onStudy={() => setView('study')}
            />
          )}
          {view === 'adventure' && <AdventureView onExit={() => setView('menu')} />}
          {view === 'learn' && (
            <LearnScreen
              challenge={challenges[challengeIndex]}
              challengeIndex={challengeIndex}
              totalChallenges={challenges.length}
              score={score}
              streak={currentStreak}
              hearts={hearts}
              maxHearts={STARTING_HEARTS}
              xp={xp}
              xpPerLevel={XP_PER_LEVEL}
              level={level}
              gameOver={gameOver}
              audioEnabled={audioEnabled}
              onToggleAudio={toggleAudio}
              onExit={() => setView('menu')}
              onAnswer={handleAnswer}
              onNext={handleNext}
              playSfx={playSfx}
            />
          )}
          {view === 'results' && (
            <ResultsScreen
              score={score}
              total={challenges.length}
              streak={bestStreak}
              hearts={hearts}
              maxHearts={STARTING_HEARTS}
              level={level}
              xp={xp}
              gameOver={gameOver}
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
