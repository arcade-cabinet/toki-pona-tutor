import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Check, Volume2, VolumeX, X } from 'lucide-react';
import type { Challenge, SfxType, WordToken } from '../types';
import { buildWordBank, isAnswerCorrect } from '../lib/challenges';

interface LearnScreenProps {
  challenge: Challenge;
  challengeIndex: number;
  totalChallenges: number;
  score: number;
  streak: number;
  audioEnabled: boolean;
  onToggleAudio: () => void;
  onExit: () => void;
  onNext: (wasCorrect: boolean) => void;
  playSfx: (type: SfxType) => void;
}

export function LearnScreen({
  challenge,
  challengeIndex,
  totalChallenges,
  score,
  streak,
  audioEnabled,
  onToggleAudio,
  onExit,
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

  useEffect(() => {
    setAvailableWords(initialBank);
    setSelectedWords([]);
    setIsChecked(false);
    setShowHint(false);
  }, [initialBank]);

  const progress = (challengeIndex / totalChallenges) * 100;

  const handleBankClick = (word: WordToken) => {
    if (isChecked) return;
    playSfx('tap');
    setAvailableWords((prev) => prev.filter((w) => w.id !== word.id));
    setSelectedWords((prev) => [...prev, word]);
  };

  const handleSelectedClick = (word: WordToken) => {
    if (isChecked) return;
    playSfx('untap');
    setSelectedWords((prev) => prev.filter((w) => w.id !== word.id));
    setAvailableWords((prev) => [...prev, word]);
  };

  const checkAnswer = () => {
    if (selectedWords.length === 0) return;
    const correct = isAnswerCorrect(selectedWords, challenge);
    setIsCorrect(correct);
    setIsChecked(true);
    if (correct) {
      playSfx('correct');
    } else {
      playSfx('wrong');
      setShakeFlash(true);
      setTimeout(() => setShakeFlash(false), 600);
    }
  };

  const handleContinue = () => {
    playSfx('tap');
    onNext(isCorrect);
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center space-x-2 mb-3 shrink-0">
        <button
          onClick={onExit}
          className="text-slate-400 hover:text-slate-600 transition-colors shrink-0"
          aria-label="Exit lesson"
        >
          <X size={26} strokeWidth={3} />
        </button>
        <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        {streak >= 2 && (
          <div className="flex items-center gap-1 px-2 py-0.5 bg-orange-100 rounded-full text-orange-600 font-black text-sm shrink-0 animate-in zoom-in-50">
            🔥 {streak}
          </div>
        )}
        <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 rounded-full text-blue-700 font-black text-sm shrink-0">
          ⭐ {score}
        </div>
        <button
          onClick={onToggleAudio}
          className={`p-1.5 rounded-xl transition-colors shrink-0 ${
            audioEnabled ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
          }`}
          aria-label="Toggle audio"
        >
          {audioEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>
      </div>

      {/* Prompt */}
      <div className="mb-4 shrink-0">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 leading-tight">
            Translate:
          </h2>
          <button
            onClick={() => {
              setShowHint((v) => !v);
              playSfx('tap');
            }}
            className="text-slate-400 hover:text-amber-500 transition-colors inline-flex items-center text-xs font-bold uppercase tracking-wide shrink-0"
          >
            <AlertCircle size={14} className="mr-1" /> Hint
          </button>
        </div>
        <div className="text-lg sm:text-xl font-bold text-blue-600 mt-2 p-3 bg-blue-50 rounded-2xl border-2 border-blue-100">
          "{challenge.prompt}"
        </div>
        {showHint && (
          <div className="mt-2 p-3 bg-amber-50 border-2 border-amber-200 text-amber-800 rounded-xl text-sm font-medium animate-in slide-in-from-top-2">
            💡 {challenge.hint}
          </div>
        )}
      </div>

      {/* Selected answer tray */}
      <div
        className={`flex flex-wrap content-start min-h-[80px] p-3 bg-slate-100 rounded-[1.5rem] border-2 border-slate-200 border-dashed gap-2 mb-3 shrink-0 transition-all ${
          shakeFlash ? 'animate-wiggle bg-red-50 border-red-200' : ''
        } ${isChecked && isCorrect ? 'bg-emerald-50 border-emerald-300' : ''}`}
      >
        {selectedWords.length === 0 && !isChecked && (
          <span className="text-slate-400 font-bold m-auto text-sm">Tap words below to build your answer</span>
        )}
        {selectedWords.map((word) => (
          <button
            key={word.id}
            onClick={() => handleSelectedClick(word)}
            disabled={isChecked}
            className={`px-3 py-2 bg-white text-slate-800 font-bold text-base sm:text-lg rounded-xl border-b-4 shadow-sm transition-transform active:scale-95 ${
              isChecked ? 'border-slate-300 cursor-default' : 'border-blue-200 hover:border-blue-400'
            }`}
          >
            {word.text}
          </button>
        ))}
      </div>

      {/* Word bank — scrollable if overflowing */}
      <div className="flex-1 min-h-0 overflow-y-auto pb-2">
        <div className="flex flex-wrap gap-2 justify-center pt-1">
          {availableWords.map((word) => (
            <button
              key={word.id}
              onClick={() => handleBankClick(word)}
              disabled={isChecked}
              className="px-3 py-2 bg-white text-slate-800 font-bold text-base sm:text-lg rounded-xl border-2 border-b-[5px] border-slate-300 shadow-sm transition-all active:border-b-2 active:translate-y-[3px] hover:bg-slate-50 disabled:opacity-50"
            >
              {word.text}
            </button>
          ))}
        </div>
      </div>

      {/* Action zone — always visible at bottom */}
      <div className="shrink-0 pt-3">
        {!isChecked ? (
          <button
            onClick={checkAnswer}
            disabled={selectedWords.length === 0}
            className={`w-full py-3 rounded-2xl font-black text-lg border-b-[6px] active:border-b-0 active:translate-y-[6px] transition-all ${
              selectedWords.length > 0
                ? 'bg-blue-500 hover:bg-blue-400 text-white border-blue-700'
                : 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed'
            }`}
          >
            Check Answer
          </button>
        ) : (
          <div
            className={`rounded-2xl p-4 ${
              isCorrect ? 'bg-emerald-100' : 'bg-red-100'
            } animate-in slide-in-from-bottom-2`}
          >
            <div className="flex items-start space-x-3 mb-3">
              <div
                className={`p-2 rounded-full shrink-0 ${
                  isCorrect ? 'bg-emerald-200 text-emerald-700' : 'bg-red-200 text-red-700'
                }`}
              >
                {isCorrect ? <Check size={24} strokeWidth={3} /> : <X size={24} strokeWidth={3} />}
              </div>
              <div className="flex-1 min-w-0">
                <h3
                  className={`text-lg font-black ${
                    isCorrect ? 'text-emerald-700' : 'text-red-700'
                  }`}
                >
                  {isCorrect ? 'Excellent!' : 'Not quite right.'}
                </h3>
                <p
                  className={`text-sm font-medium ${
                    isCorrect ? 'text-emerald-700' : 'text-red-700'
                  }`}
                >
                  {isCorrect ? challenge.hint : `Answer: ${challenge.target.join(' ')}`}
                </p>
              </div>
            </div>
            <button
              onClick={handleContinue}
              className={`w-full py-3 rounded-xl font-black text-lg text-white border-b-[6px] active:border-b-0 active:translate-y-[6px] transition-all ${
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
