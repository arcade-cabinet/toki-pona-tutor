import { useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { AlertCircle, Check, Volume2, VolumeX, X, Frown } from 'lucide-react';
import type { Challenge, SfxType, WordToken } from '../types';
import { buildWordBank, isAnswerCorrect } from '../lib/challenges';
import { HeartDisplay } from './HeartDisplay';

interface LearnScreenProps {
  challenge: Challenge;
  challengeIndex: number;
  totalChallenges: number;
  score: number;
  streak: number;
  hearts: number;
  maxHearts: number;
  xp: number;
  xpPerLevel: number;
  level: number;
  gameOver: boolean;
  audioEnabled: boolean;
  onToggleAudio: () => void;
  onExit: () => void;
  onAnswer: (wasCorrect: boolean) => void;
  onNext: () => void;
  playSfx: (type: SfxType) => void;
}

export function LearnScreen({
  challenge,
  challengeIndex,
  totalChallenges,
  score,
  streak,
  hearts,
  maxHearts,
  xp,
  xpPerLevel,
  level,
  gameOver,
  audioEnabled,
  onToggleAudio,
  onExit,
  onAnswer,
  onNext,
  playSfx,
}: LearnScreenProps) {
  const initialBank = useMemo(() => buildWordBank(challenge), [challenge]);
  const [availableWords, setAvailableWords] = useState<WordToken[]>(initialBank);
  const [selectedWords, setSelectedWords] = useState<WordToken[]>([]);
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [shakeFlash, setShakeFlash] = useState(false);
  const [pointsPop, setPointsPop] = useState<{ key: number; delta: number } | null>(null);
  const [levelFlash, setLevelFlash] = useState(false);
  const prevLevel = useRef(level);

  useEffect(() => {
    setAvailableWords(initialBank);
    setSelectedWords([]);
    setIsChecked(false);
    setShowHint(false);
  }, [initialBank]);

  useEffect(() => {
    if (level > prevLevel.current) {
      setLevelFlash(true);
      const t = setTimeout(() => setLevelFlash(false), 1500);
      prevLevel.current = level;
      return () => clearTimeout(t);
    }
  }, [level]);

  const progress = (challengeIndex / totalChallenges) * 100;
  const xpPercent = (xp / xpPerLevel) * 100;

  const handleBankClick = (word: WordToken) => {
    if (isChecked || gameOver) return;
    playSfx('tap');
    setAvailableWords((prev) => prev.filter((w) => w.id !== word.id));
    setSelectedWords((prev) => [...prev, word]);
  };

  const handleSelectedClick = (word: WordToken) => {
    if (isChecked || gameOver) return;
    playSfx('untap');
    setSelectedWords((prev) => prev.filter((w) => w.id !== word.id));
    setAvailableWords((prev) => [...prev, word]);
  };

  const fireConfetti = () => {
    confetti({
      particleCount: streak >= 3 ? 80 : 50,
      spread: 70,
      startVelocity: 35,
      origin: { y: 0.55 },
      colors: ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'],
      scalar: 0.9,
    });
  };

  const checkAnswer = () => {
    if (selectedWords.length === 0) return;
    const correct = isAnswerCorrect(selectedWords, challenge);
    setIsCorrect(correct);
    setIsChecked(true);
    if (correct) {
      playSfx('correct');
      fireConfetti();
      const bonus = streak + 1 >= 2 ? 5 : 0;
      setPointsPop({ key: Date.now(), delta: 10 + bonus });
      setTimeout(() => setPointsPop(null), 1200);
    } else {
      playSfx('wrong');
      setShakeFlash(true);
      setShowHint(true);
      setTimeout(() => setShakeFlash(false), 600);
    }
    onAnswer(correct);
  };

  const handleContinue = () => {
    playSfx('tap');
    onNext();
  };

  return (
    <div className="flex flex-col h-full min-h-0 relative">
      {/* Top HUD row */}
      <div className="flex items-center space-x-2 mb-2 shrink-0">
        <button
          onClick={onExit}
          className="text-slate-400 hover:text-slate-600 transition-colors shrink-0"
          aria-label="Exit lesson"
        >
          <X size={24} strokeWidth={3} />
        </button>
        <HeartDisplay hearts={hearts} max={maxHearts} />
        <div className="flex-1" />
        {streak >= 2 && (
          <div className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-orange-400 to-red-400 text-white rounded-full font-black text-xs shrink-0 animate-in zoom-in-75 shadow-sm">
            🔥 {streak}
          </div>
        )}
        <button
          onClick={onToggleAudio}
          className={`p-1.5 rounded-xl transition-colors shrink-0 ${
            audioEnabled ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
          }`}
          aria-label="Toggle audio"
        >
          {audioEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
      </div>

      {/* XP bar + Level + Score */}
      <div className="flex items-center gap-2 mb-2 shrink-0">
        <div
          className={`flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white font-black text-xs shadow-sm shrink-0 transition-transform ${
            levelFlash ? 'scale-125' : ''
          }`}
        >
          {level}
        </div>
        <div className="flex-1 relative h-3 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-400 to-orange-400 transition-all duration-500 ease-out"
            style={{ width: `${xpPercent}%` }}
          />
          {levelFlash && (
            <div className="absolute inset-0 bg-white/60 animate-pulse pointer-events-none" />
          )}
        </div>
        <div className="text-xs font-black text-slate-500 tabular-nums">{score}⭐</div>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3 shrink-0">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {levelFlash && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-black text-xl px-5 py-2 rounded-2xl shadow-lg animate-in zoom-in-50 slide-in-from-top-2 z-20 pointer-events-none">
          LEVEL {level}! ✨
        </div>
      )}

      {/* Prompt */}
      <div className="mb-3 shrink-0">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-xs font-black text-slate-500 uppercase tracking-wide">
            Translate
          </h2>
          <button
            onClick={() => {
              setShowHint((v) => !v);
              playSfx('tap');
            }}
            className="text-slate-400 hover:text-amber-500 transition-colors inline-flex items-center text-xs font-bold uppercase tracking-wide shrink-0"
          >
            <AlertCircle size={13} className="mr-1" /> Hint
          </button>
        </div>
        <div className="text-lg sm:text-xl font-bold text-blue-700 mt-1.5 p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border-2 border-blue-200">
          "{challenge.prompt}"
        </div>
        {showHint && (
          <div className="mt-2 p-2.5 bg-amber-50 border-2 border-amber-200 text-amber-800 rounded-xl text-xs font-medium animate-in slide-in-from-top-2">
            💡 {challenge.hint}
          </div>
        )}
      </div>

      {/* Selected answer tray */}
      <div
        className={`flex flex-wrap content-start min-h-[72px] p-2.5 rounded-2xl border-2 border-dashed gap-2 mb-2.5 shrink-0 transition-all ${
          shakeFlash ? 'animate-wiggle bg-red-50 border-red-300' : ''
        } ${
          isChecked && isCorrect
            ? 'bg-emerald-50 border-emerald-300'
            : 'bg-slate-50 border-slate-200'
        }`}
      >
        {selectedWords.length === 0 && !isChecked && (
          <span className="text-slate-400 font-bold m-auto text-xs">
            Tap words below to build your answer
          </span>
        )}
        {selectedWords.map((word) => (
          <button
            key={word.id}
            onClick={() => handleSelectedClick(word)}
            disabled={isChecked || gameOver}
            className={`px-3 py-1.5 bg-white text-slate-800 font-bold text-base rounded-xl border-b-4 shadow-sm transition-transform active:scale-95 ${
              isChecked ? 'border-slate-300 cursor-default' : 'border-blue-300 hover:border-blue-500'
            }`}
          >
            {word.text}
          </button>
        ))}
      </div>

      {/* Word bank — scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto pb-2">
        <div className="flex flex-wrap gap-2 justify-center pt-1">
          {availableWords.map((word) => (
            <button
              key={word.id}
              onClick={() => handleBankClick(word)}
              disabled={isChecked || gameOver}
              className="px-3 py-1.5 bg-white text-slate-800 font-bold text-base rounded-xl border-2 border-b-[5px] border-slate-300 shadow-sm transition-all active:border-b-2 active:translate-y-[3px] hover:bg-slate-50 disabled:opacity-40"
            >
              {word.text}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom action / feedback */}
      <div className="shrink-0 pt-2 relative">
        {pointsPop && (
          <div
            key={pointsPop.key}
            className="absolute left-1/2 -top-4 -translate-x-1/2 text-2xl font-black text-amber-500 drop-shadow animate-points-pop pointer-events-none z-30"
          >
            +{pointsPop.delta} XP
          </div>
        )}

        {gameOver && isChecked ? (
          <div className="rounded-2xl p-4 bg-red-50 border-2 border-red-200 animate-in slide-in-from-bottom-2">
            <div className="flex items-center gap-3 mb-3">
              <Frown size={32} className="text-red-500 shrink-0" />
              <div>
                <h3 className="text-lg font-black text-red-700">Out of hearts!</h3>
                <p className="text-xs font-medium text-red-600">
                  The answer was: {challenge.target.join(' ')}
                </p>
              </div>
            </div>
            <button
              onClick={handleContinue}
              className="w-full py-3 rounded-xl font-black text-base text-white border-b-[6px] active:border-b-0 active:translate-y-[6px] transition-all bg-red-500 border-red-700 hover:bg-red-400"
            >
              See Results
            </button>
          </div>
        ) : !isChecked ? (
          <button
            onClick={checkAnswer}
            disabled={selectedWords.length === 0}
            className={`w-full py-3 rounded-2xl font-black text-base border-b-[6px] active:border-b-0 active:translate-y-[6px] transition-all ${
              selectedWords.length > 0
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white border-blue-700'
                : 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed'
            }`}
          >
            Check Answer
          </button>
        ) : (
          <div
            className={`rounded-2xl p-3 ${
              isCorrect
                ? 'bg-emerald-50 border-2 border-emerald-200'
                : 'bg-red-50 border-2 border-red-200'
            } animate-in slide-in-from-bottom-2`}
          >
            <div className="flex items-start space-x-2 mb-2">
              <div
                className={`p-1.5 rounded-full shrink-0 ${
                  isCorrect ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                }`}
              >
                {isCorrect ? <Check size={18} strokeWidth={3} /> : <X size={18} strokeWidth={3} />}
              </div>
              <div className="flex-1 min-w-0">
                <h3
                  className={`text-base font-black ${
                    isCorrect ? 'text-emerald-700' : 'text-red-700'
                  }`}
                >
                  {isCorrect ? (streak >= 3 ? 'pona mute! 🔥' : 'Excellent!') : 'Not quite.'}
                </h3>
                <p
                  className={`text-xs font-medium ${
                    isCorrect ? 'text-emerald-700' : 'text-red-700'
                  }`}
                >
                  {isCorrect ? challenge.hint : `Answer: ${challenge.target.join(' ')}`}
                </p>
              </div>
            </div>
            <button
              onClick={handleContinue}
              className={`w-full py-2.5 rounded-xl font-black text-base text-white border-b-[5px] active:border-b-0 active:translate-y-[5px] transition-all ${
                isCorrect
                  ? 'bg-emerald-500 border-emerald-700 hover:bg-emerald-400'
                  : 'bg-red-500 border-red-700 hover:bg-red-400'
              }`}
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
