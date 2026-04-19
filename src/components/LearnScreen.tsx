import { useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { AlertCircle, Check, Volume2, VolumeX, X, Frown } from 'lucide-react';
import type { Challenge, SfxType, WordToken } from '../types';
import { buildWordBank, isAnswerCorrect } from '../lib/challenges';
import { HeartDisplay } from './HeartDisplay';
import { Mascot, type MascotMood } from './Mascot';

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

function comboLabel(streak: number): { label: string; color: string } | null {
  if (streak < 2) return null;
  if (streak >= 5) return { label: `x${streak} UNSTOPPABLE!`, color: 'from-pink-500 to-orange-500' };
  if (streak >= 3) return { label: `x${streak} BLAZING!`, color: 'from-orange-500 to-yellow-400' };
  return { label: `x${streak} NICE!`, color: 'from-yellow-400 to-lime-400' };
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
  const [shakeFlash, setShakeFlash] = useState<'none' | 'soft' | 'hard'>('none');
  const [flashBurst, setFlashBurst] = useState(false);
  const [pointsPop, setPointsPop] = useState<{ key: number; delta: number } | null>(null);
  const [levelFlash, setLevelFlash] = useState(false);
  const [comboFlash, setComboFlash] = useState<{ key: number; data: ReturnType<typeof comboLabel> } | null>(null);
  const [mascotMood, setMascotMood] = useState<MascotMood>('idle');
  const prevLevel = useRef(level);
  const prevStreak = useRef(streak);

  useEffect(() => {
    setAvailableWords(initialBank);
    setSelectedWords([]);
    setIsChecked(false);
    setShowHint(false);
    setMascotMood('idle');
  }, [initialBank]);

  useEffect(() => {
    if (level > prevLevel.current) {
      setLevelFlash(true);
      const t = setTimeout(() => setLevelFlash(false), 1600);
      prevLevel.current = level;
      return () => clearTimeout(t);
    }
  }, [level]);

  useEffect(() => {
    if (streak > prevStreak.current && streak >= 2) {
      const data = comboLabel(streak);
      if (data) {
        setComboFlash({ key: Date.now(), data });
        setTimeout(() => setComboFlash(null), 1100);
      }
    }
    prevStreak.current = streak;
  }, [streak]);

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
      particleCount: streak >= 3 ? 110 : 60,
      spread: 80,
      startVelocity: 42,
      origin: { y: 0.55 },
      colors: ['#ff6b6b', '#feb47b', '#ffd26f', '#84fab0', '#ec4899', '#f97316'],
      scalar: 1,
    });
  };

  const triggerShake = (hard: boolean) => {
    setShakeFlash(hard ? 'hard' : 'soft');
    setTimeout(() => setShakeFlash('none'), hard ? 600 : 400);
  };

  const triggerFlash = () => {
    setFlashBurst(true);
    setTimeout(() => setFlashBurst(false), 300);
  };

  const checkAnswer = () => {
    if (selectedWords.length === 0) return;
    const correct = isAnswerCorrect(selectedWords, challenge);
    setIsCorrect(correct);
    setIsChecked(true);
    if (correct) {
      playSfx('correct');
      fireConfetti();
      triggerFlash();
      triggerShake(false);
      const bonus = streak + 1 >= 2 ? 5 : 0;
      setPointsPop({ key: Date.now(), delta: 10 + bonus });
      setTimeout(() => setPointsPop(null), 1300);
      setMascotMood(streak + 1 >= 3 ? 'streak' : 'correct');
    } else {
      playSfx('wrong');
      triggerShake(true);
      setShowHint(true);
      setMascotMood('wrong');
    }
    onAnswer(correct);
  };

  const handleContinue = () => {
    playSfx('tap');
    onNext();
  };

  const shakeClass =
    shakeFlash === 'hard' ? 'animate-shake-hard' : shakeFlash === 'soft' ? 'animate-shake' : '';

  return (
    <div className={`flex flex-col h-full min-h-0 relative ${shakeClass}`}>
      {flashBurst && (
        <div className="absolute inset-0 pointer-events-none z-40 animate-flash rounded-[2rem]" />
      )}

      {/* Combo callout */}
      {comboFlash?.data && (
        <div
          key={comboFlash.key}
          className={`absolute top-1/2 left-1/2 z-40 px-6 py-3 rounded-2xl bg-gradient-to-r ${comboFlash.data.color} text-white font-display text-3xl shadow-2xl animate-combo-burst pointer-events-none`}
          style={{ whiteSpace: 'nowrap' }}
        >
          {comboFlash.data.label}
        </div>
      )}

      {/* Top HUD row */}
      <div className="flex items-center space-x-2 mb-2 shrink-0">
        <button
          onClick={onExit}
          className="text-white/80 hover:text-white transition-colors shrink-0"
          aria-label="Exit lesson"
        >
          <X size={22} strokeWidth={3} />
        </button>
        <HeartDisplay hearts={hearts} max={maxHearts} />
        <div className="flex-1" />
        {streak >= 2 && (
          <div className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-yellow-400 to-pink-500 text-white rounded-full font-display text-xs shrink-0 shadow-md">
            🔥 {streak}
          </div>
        )}
        <button
          onClick={onToggleAudio}
          className={`p-1.5 rounded-xl transition-colors shrink-0 ${
            audioEnabled ? 'bg-white/90 text-pink-600' : 'bg-white/40 text-white/70'
          }`}
          aria-label="Toggle audio"
        >
          {audioEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
      </div>

      {/* XP bar + Level */}
      <div className="flex items-center gap-2 mb-2 shrink-0">
        <div
          className={`flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-yellow-300 to-orange-500 text-white font-display text-xs shadow-md shrink-0 transition-transform ${
            levelFlash ? 'scale-125' : ''
          }`}
        >
          {level}
        </div>
        <div className="flex-1 relative h-3 bg-white/30 rounded-full overflow-hidden border border-white/40">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-yellow-300 to-orange-400 transition-all duration-500 ease-out"
            style={{ width: `${xpPercent}%` }}
          />
          {levelFlash && (
            <div className="absolute inset-0 bg-white/70 animate-pulse pointer-events-none" />
          )}
        </div>
        <div className="font-pixel text-[11px] text-white font-bold tabular-nums">{score}⭐</div>
      </div>
      <div className="h-1.5 bg-white/25 rounded-full overflow-hidden mb-3 shrink-0 border border-white/30">
        <div
          className="h-full bg-white/90 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {levelFlash && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-display text-2xl px-6 py-2 rounded-2xl shadow-2xl animate-in zoom-in-50 slide-in-from-top-2 z-30 pointer-events-none">
          LEVEL {level}! ✨
        </div>
      )}

      {/* Prompt card + mascot */}
      <div className="mb-3 shrink-0 flex items-start gap-3">
        <div className="flex-1 bg-white rounded-2xl p-3 shadow-lg border-b-4 border-orange-200">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h2 className="font-display text-xs text-orange-500 uppercase tracking-wider">
              Translate
            </h2>
            <button
              onClick={() => {
                setShowHint((v) => !v);
                playSfx('tap');
                setMascotMood('hint');
              }}
              className="text-slate-400 hover:text-amber-500 transition-colors inline-flex items-center font-display text-[10px] uppercase tracking-wider shrink-0"
            >
              <AlertCircle size={12} className="mr-0.5" /> Hint
            </button>
          </div>
          <div className="font-tile text-base sm:text-lg text-slate-800 leading-tight">
            "{challenge.prompt}"
          </div>
          {showHint && (
            <div className="mt-2 p-2 bg-amber-50 border-2 border-amber-200 text-amber-800 rounded-xl text-xs font-medium animate-in slide-in-from-top-2">
              💡 {challenge.hint}
            </div>
          )}
        </div>
        <div className="shrink-0 -mr-1 -mt-2">
          <Mascot mood={mascotMood} size={64} />
        </div>
      </div>

      {/* Selected answer tray */}
      <div
        className={`flex flex-wrap content-start min-h-[72px] p-2.5 rounded-2xl border-2 border-dashed gap-2 mb-2.5 shrink-0 transition-all ${
          isChecked && isCorrect
            ? 'bg-lime-50 border-lime-400'
            : isChecked && !isCorrect
            ? 'bg-red-50 border-red-300'
            : 'bg-white/60 border-white/70'
        }`}
      >
        {selectedWords.length === 0 && !isChecked && (
          <span className="text-white/90 font-display text-xs m-auto uppercase tracking-wider">
            Tap words to build
          </span>
        )}
        {selectedWords.map((word) => (
          <button
            key={word.id}
            onClick={() => handleSelectedClick(word)}
            disabled={isChecked || gameOver}
            className={`px-3 py-1.5 bg-white text-slate-800 font-tile text-base rounded-xl border-b-4 shadow-md transition-transform active:scale-95 ${
              isChecked ? 'border-slate-300 cursor-default' : 'border-pink-400 hover:border-pink-500'
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
              className="px-3 py-1.5 bg-white text-slate-800 font-tile text-base rounded-xl border-2 border-b-[5px] border-orange-300 shadow-md transition-all active:border-b-2 active:translate-y-[3px] hover:bg-orange-50 disabled:opacity-40"
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
            className="absolute left-1/2 -top-4 -translate-x-1/2 font-display text-3xl text-yellow-300 drop-shadow-[0_2px_0_rgba(234,88,12,0.8)] animate-points-pop pointer-events-none z-30"
          >
            +{pointsPop.delta} XP
          </div>
        )}

        {gameOver && isChecked ? (
          <div className="rounded-2xl p-4 bg-white border-b-4 border-red-400 shadow-lg animate-in slide-in-from-bottom-2">
            <div className="flex items-center gap-3 mb-3">
              <Frown size={32} className="text-red-500 shrink-0" />
              <div>
                <h3 className="font-display text-xl text-red-600">OUT OF HEARTS!</h3>
                <p className="text-xs font-medium text-slate-600">
                  Answer: <span className="font-tile">{challenge.target.join(' ')}</span>
                </p>
              </div>
            </div>
            <button
              onClick={handleContinue}
              className="w-full py-3 rounded-xl font-display text-lg text-white border-b-[5px] active:border-b-0 active:translate-y-[5px] transition-all bg-gradient-to-b from-red-500 to-red-600 border-red-800 hover:from-red-400 hover:to-red-500"
            >
              See Results
            </button>
          </div>
        ) : !isChecked ? (
          <button
            onClick={checkAnswer}
            disabled={selectedWords.length === 0}
            className={`w-full py-3 rounded-2xl font-display text-xl border-b-[6px] active:border-b-0 active:translate-y-[6px] transition-all ${
              selectedWords.length > 0
                ? 'bg-gradient-to-b from-lime-400 to-green-500 hover:from-lime-300 hover:to-green-400 text-white border-green-700 shadow-lg'
                : 'bg-white/50 text-white/70 border-white/60 cursor-not-allowed'
            }`}
          >
            CHECK
          </button>
        ) : (
          <div
            className={`rounded-2xl p-3 bg-white border-b-4 shadow-lg ${
              isCorrect ? 'border-lime-400' : 'border-red-400'
            } animate-in slide-in-from-bottom-2`}
          >
            <div className="flex items-start space-x-2 mb-2">
              <div
                className={`p-1.5 rounded-full shrink-0 ${
                  isCorrect ? 'bg-lime-500 text-white' : 'bg-red-500 text-white'
                }`}
              >
                {isCorrect ? <Check size={18} strokeWidth={3} /> : <X size={18} strokeWidth={3} />}
              </div>
              <div className="flex-1 min-w-0">
                <h3
                  className={`font-display text-lg ${
                    isCorrect ? 'text-lime-600' : 'text-red-600'
                  }`}
                >
                  {isCorrect
                    ? streak >= 5
                      ? 'UNSTOPPABLE!'
                      : streak >= 3
                      ? 'BLAZING!'
                      : 'NICE!'
                    : 'NOT QUITE!'}
                </h3>
                <p className="text-xs font-medium text-slate-600">
                  {isCorrect ? challenge.hint : (
                    <>Answer: <span className="font-tile">{challenge.target.join(' ')}</span></>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={handleContinue}
              className={`w-full py-2.5 rounded-xl font-display text-lg text-white border-b-[5px] active:border-b-0 active:translate-y-[5px] transition-all ${
                isCorrect
                  ? 'bg-gradient-to-b from-lime-400 to-green-500 border-green-700'
                  : 'bg-gradient-to-b from-red-500 to-red-600 border-red-800'
              }`}
            >
              {isCorrect ? 'Next →' : 'Try Next →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
