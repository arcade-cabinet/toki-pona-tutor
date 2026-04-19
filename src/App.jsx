import React, { useState, useEffect, useRef, useMemo } from 'react';
import { BookOpen, Play, Check, ArrowLeft, Trophy, AlertCircle, Sparkles, X, RotateCcw, Volume2, VolumeX, Music } from 'lucide-react';

// --- Dictionary & Curriculum Data ---
const dictionary = [
  { tp: 'toki', en: 'speak, language', type: 'root' },
  { tp: 'pona', en: 'good, simple, fix', type: 'root' },
  { tp: 'jan', en: 'person, human', type: 'root' },
  { tp: 'mi', en: 'I, me', type: 'root' },
  { tp: 'sina', en: 'you', type: 'root' },
  { tp: 'ona', en: 'he, she, it, they', type: 'root' },
  { tp: 'moku', en: 'food, eat', type: 'root' },
  { tp: 'telo', en: 'water, liquid', type: 'root' },
  { tp: 'suli', en: 'big, important', type: 'root' },
  { tp: 'lili', en: 'small, little', type: 'root' },
  { tp: 'pali', en: 'do, work, make', type: 'root' },
  { tp: 'tomo', en: 'house, room', type: 'root' },
  { tp: 'lukin', en: 'see, look at', type: 'root' },
  { tp: 'wile', en: 'want, need', type: 'root' },
  { tp: 'kili', en: 'fruit, vegetable', type: 'root' },
  { tp: 'soweli', en: 'animal', type: 'root' },
  { tp: 'seli', en: 'fire, heat', type: 'root' },
  { tp: 'lete', en: 'cold', type: 'root' },
  { tp: 'sona', en: 'know, knowledge', type: 'root' },
  { tp: 'ilo', en: 'tool, device', type: 'root' },
  { tp: 'li', en: '[verb marker]', type: 'particle' },
  { tp: 'e', en: '[object marker]', type: 'particle' }
];

const challenges = [
  { prompt: "A good person (friend)", target: ["jan", "pona"], hint: "In Toki Pona, the adjective always comes AFTER the noun. 'Person' + 'Good'.", type: "concept" },
  { prompt: "Hot water (Coffee/Tea)", target: ["telo", "seli"], hint: "Think: 'Water' + 'Hot'. Modifiers follow the main word.", type: "concept" },
  { prompt: "School (Building of knowledge)", target: ["tomo", "sona"], hint: "How do you say 'Room of Knowledge'?", type: "concept" },
  { prompt: "I eat.", target: ["mi", "moku"], hint: "When 'mi' or 'sina' is the subject, you just put the verb right after.", type: "sentence" },
  { prompt: "You look.", target: ["sina", "lukin"], hint: "Simple Subject + Verb.", type: "sentence" },
  { prompt: "The person eats.", target: ["jan", "li", "moku"], hint: "CRITICAL GRAMMAR: If the subject is NOT 'mi' or 'sina', you MUST put 'li' before the verb!", type: "sentence" },
  { prompt: "The big animal sleeps (waits).", target: ["soweli", "suli", "li", "awen"], hint: "Subject (Animal Big) + 'li' + Verb (Wait/Stay).", type: "sentence" },
  { prompt: "I eat the fruit.", target: ["mi", "moku", "e", "kili"], hint: "CRITICAL GRAMMAR: You must put 'e' right before the thing being acted upon (the direct object).", type: "sentence" },
  { prompt: "You want water.", target: ["sina", "wile", "e", "telo"], hint: "Subject + Verb + 'e' + Object.", type: "sentence" },
  { prompt: "The good person makes a house.", target: ["jan", "pona", "li", "pali", "e", "tomo"], hint: "Putting it all together: Subject (Person Good) + 'li' + Verb (Make) + 'e' + Object (House).", type: "sentence" }
];

export default function App() {
  const [view, setView] = useState('menu');
  const [currentLevel, setCurrentLevel] = useState(0);
  const [score, setScore] = useState(0);
  
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [availableWords, setAvailableWords] = useState([]);
  const [selectedWords, setSelectedWords] = useState([]);
  
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // --- Audio State & Refs ---
  const [toneLoaded, setToneLoaded] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const audioCtx = useRef(null);

  // Load Tone.js dynamically
  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.49/Tone.js";
    script.async = true;
    script.onload = () => setToneLoaded(true);
    document.body.appendChild(script);
    return () => document.body.removeChild(script);
  }, []);

  // Initialize Tone.js Environment
  const initAudio = async () => {
    if (!window.Tone || audioCtx.current) return;
    
    const T = window.Tone;
    await T.start(); // Required user gesture to start AudioContext

    // Master Output & Compressor (prevents loud peaking)
    const compressor = new T.Compressor(-30, 3).toDestination();
    const masterVol = new T.Volume(-5).connect(compressor);

    // 1. Background Music Synth (Smooth Pad)
    const reverb = new T.Reverb({ decay: 6, wet: 0.8 }).connect(masterVol);
    const lowPass = new T.Filter(600, "lowpass").connect(reverb); // Cuts harsh highs
    
    const bgmSynth = new T.PolySynth(T.Synth, {
      oscillator: { type: "sine" }, // Purest, softest waveform
      envelope: { attack: 2, decay: 2, sustain: 0.8, release: 4 }
    }).connect(lowPass);
    bgmSynth.volume.value = -12;

    // Generative Ambient Loop
    const chords = [
      ["C3", "E3", "G3", "C4"], // C Major
      ["A2", "C3", "E3", "A3"], // A minor
      ["F2", "A2", "C3", "F3"], // F Major
      ["G2", "B2", "D3", "G3"]  // G Major
    ];
    let chordIndex = 0;
    
    const bgmLoop = new T.Loop((time) => {
      // Play a very slow, gentle chord
      bgmSynth.triggerAttackRelease(chords[chordIndex], "1m", time);
      chordIndex = (chordIndex + 1) % chords.length;
    }, "2m"); // Plays every 2 measures

    T.Transport.bpm.value = 65; // Slow, relaxing tempo

    // 2. SFX Synthesizers
    const sfxDelay = new T.FeedbackDelay("8n", 0.4).connect(masterVol);
    sfxDelay.wet.value = 0.2;

    const popSynth = new T.Synth({
      oscillator: { type: "triangle" },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.1 }
    }).connect(sfxDelay);
    popSynth.volume.value = -8;

    const chordSynth = new T.PolySynth(T.Synth, {
      oscillator: { type: "triangle" },
      envelope: { attack: 0.05, decay: 0.5, sustain: 0.2, release: 1 }
    }).connect(reverb);
    chordSynth.volume.value = -10;

    const errorSynth = new T.Synth({
      oscillator: { type: "sine" },
      envelope: { attack: 0.1, decay: 0.4, sustain: 0.1, release: 0.5 }
    }).connect(masterVol);
    errorSynth.volume.value = -2;

    audioCtx.current = { T, bgmSynth, bgmLoop, popSynth, chordSynth, errorSynth, masterVol };
    setAudioEnabled(true);
    
    T.Transport.start();
    bgmLoop.start(0);
  };

  const toggleAudio = () => {
    if (!audioCtx.current) return;
    const { masterVol } = audioCtx.current;
    if (audioEnabled) {
      masterVol.mute = true;
      setAudioEnabled(false);
    } else {
      masterVol.mute = false;
      setAudioEnabled(true);
    }
  };

  // --- Sound Effect Triggers ---
  const playSfx = (type) => {
    if (!audioEnabled || !audioCtx.current) return;
    const { popSynth, chordSynth, errorSynth, T } = audioCtx.current;
    const now = T.now();

    switch (type) {
      case 'tap':
        // A gentle bubble pop
        popSynth.triggerAttackRelease("C5", "32n", now);
        break;
      case 'untap':
        popSynth.triggerAttackRelease("A4", "32n", now);
        break;
      case 'correct':
        // Ascending major arpeggio
        chordSynth.triggerAttackRelease(["C4", "E4", "G4", "C5"], "2n", now);
        break;
      case 'wrong':
        // Soft descending interval (not a harsh buzzer)
        errorSynth.triggerAttackRelease("Eb3", "8n", now);
        errorSynth.triggerAttackRelease("C3", "4n", now + 0.2);
        break;
      case 'win':
        // Bright, triumphant chord
        chordSynth.triggerAttackRelease(["C4", "E4", "G4", "B4", "D5"], "1m", now);
        break;
      default:
        break;
    }
  };

  // --- Game Logic ---

  const getDistractors = (targetWords, count) => {
    const distractors = [];
    const pool = dictionary.filter(w => !targetWords.includes(w.tp));
    const shuffledPool = [...pool].sort(() => 0.5 - Math.random());
    for (let i = 0; i < count; i++) {
      if (shuffledPool[i]) distractors.push(shuffledPool[i].tp);
    }
    return distractors;
  };

  const loadChallenge = (index) => {
    if (index >= challenges.length) {
      setView('results');
      playSfx('win');
      return;
    }
    
    const challenge = challenges[index];
    setActiveChallenge(challenge);
    setSelectedWords([]);
    setIsChecked(false);
    setShowHint(false);

    const distractors = getDistractors(challenge.target, 5);
    const bank = [...challenge.target, ...distractors].sort(() => 0.5 - Math.random());
    setAvailableWords(bank.map((word, i) => ({ id: `word-${i}`, text: word })));
  };

  const startGame = async () => {
    if (toneLoaded && !audioCtx.current) {
      await initAudio();
    }
    setCurrentLevel(0);
    setScore(0);
    loadChallenge(0);
    setView('learn');
  };

  const handleWordClick = (wordObj, fromBank) => {
    if (isChecked) return;
    
    if (fromBank) {
      playSfx('tap');
      setAvailableWords(prev => prev.filter(w => w.id !== wordObj.id));
      setSelectedWords(prev => [...prev, wordObj]);
    } else {
      playSfx('untap');
      setSelectedWords(prev => prev.filter(w => w.id !== wordObj.id));
      setAvailableWords(prev => [...prev, wordObj]);
    }
  };

  const checkAnswer = () => {
    if (selectedWords.length === 0) return;
    
    const userAnswer = selectedWords.map(w => w.text);
    const targetAnswer = activeChallenge.target;
    const correct = userAnswer.length === targetAnswer.length && 
                    userAnswer.every((val, index) => val === targetAnswer[index]);
    
    setIsCorrect(correct);
    setIsChecked(true);
    
    if (correct) {
      playSfx('correct');
      setScore(prev => prev + 1);
    } else {
      playSfx('wrong');
    }
  };

  const nextChallenge = () => {
    setCurrentLevel(prev => prev + 1);
    loadChallenge(currentLevel + 1);
  };

  // --- Views ---

  const MenuScreen = () => (
    <div className="flex flex-col h-full items-center justify-center text-center space-y-8 animate-in fade-in duration-500">
      <div className="space-y-4">
        <div className="flex justify-center space-x-2 text-5xl mb-4 relative">
          <span className="animate-bounce" style={{animationDelay: '0ms'}}>🧱</span>
          <span className="animate-bounce" style={{animationDelay: '150ms'}}>🧠</span>
          <span className="animate-bounce" style={{animationDelay: '300ms'}}>✨</span>
          {audioEnabled && (
            <Music className="absolute -right-8 -top-4 text-emerald-400 animate-pulse" size={24} />
          )}
        </div>
        <h1 className="text-5xl font-black text-slate-800 tracking-tight leading-none">
          kama sona
        </h1>
        <p className="text-lg text-slate-500 font-bold uppercase tracking-widest max-w-xs mx-auto">
          Master the Grammar of Simplicity
        </p>
      </div>

      <div className="flex flex-col w-full max-w-sm space-y-4 mt-8">
        <button 
          onClick={startGame}
          disabled={!toneLoaded}
          className="group relative flex items-center justify-center p-4 bg-blue-500 hover:bg-blue-400 text-white rounded-2xl font-bold text-xl border-b-[6px] border-blue-700 active:border-b-0 active:translate-y-[6px] transition-all disabled:opacity-50 disabled:cursor-wait"
        >
          <Play size={28} className="mr-3 fill-white" />
          <span>{toneLoaded ? 'Start Learning' : 'Loading Audio...'}</span>
        </button>

        <button 
          onClick={() => setView('study')}
          className="group relative flex items-center justify-center p-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-xl border-b-[6px] border-slate-300 active:border-b-0 active:translate-y-[6px] transition-all"
        >
          <BookOpen size={28} className="mr-3" />
          <span>Dictionary & Rules</span>
        </button>
      </div>
    </div>
  );

  const LearnScreen = () => {
    if (!activeChallenge) return null;
    const progress = (currentLevel / challenges.length) * 100;

    return (
      <div className="flex flex-col h-full animate-in fade-in duration-300 relative">
        
        {/* Header / Progress & Audio Controls */}
        <div className="flex items-center space-x-4 mb-6">
          <button onClick={() => setView('menu')} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={28} strokeWidth={3} />
          </button>
          <div className="flex-1 h-4 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <button onClick={toggleAudio} className={`p-2 rounded-xl transition-colors ${audioEnabled ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
            {audioEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
          </button>
        </div>

        <div className="mb-6">
          <h2 className="text-3xl font-black text-slate-800 leading-tight">Translate this sentence:</h2>
          <div className="text-xl font-bold text-blue-600 mt-2 p-4 bg-blue-50 rounded-2xl border-2 border-blue-100 inline-block">
            "{activeChallenge.prompt}"
          </div>
          
          <button 
            onClick={() => { setShowHint(!showHint); playSfx('tap'); }}
            className="ml-3 text-slate-400 hover:text-amber-500 transition-colors inline-flex items-center text-sm font-bold uppercase tracking-wide"
          >
            <AlertCircle size={16} className="mr-1" /> Need a hint?
          </button>
          
          {showHint && (
            <div className="mt-3 p-3 bg-amber-50 border-2 border-amber-200 text-amber-800 rounded-xl text-sm font-medium animate-in slide-in-from-top-2">
              💡 <strong>Instructor Note:</strong> {activeChallenge.hint}
            </div>
          )}
        </div>

        <div className="flex flex-wrap content-start min-h-[120px] p-4 bg-slate-100 rounded-[2rem] border-4 border-slate-200 border-dashed gap-3 mb-6 transition-colors duration-300">
          {selectedWords.length === 0 && !isChecked && (
            <span className="text-slate-400 font-bold m-auto">Tap words to build your answer</span>
          )}
          {selectedWords.map((word) => (
            <button
              key={word.id}
              onClick={() => handleWordClick(word, false)}
              className={`px-4 py-3 bg-white text-slate-800 font-bold text-lg rounded-2xl border-b-4 shadow-sm transition-transform active:scale-95 flex items-center ${isChecked ? 'border-slate-300 cursor-default' : 'border-blue-200 hover:border-blue-400 cursor-pointer'}`}
            >
              {word.text}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 justify-center mb-auto pt-4">
          {availableWords.map((word) => (
            <button
              key={word.id}
              onClick={() => handleWordClick(word, true)}
              className="px-4 py-3 bg-white text-slate-800 font-bold text-lg rounded-2xl border-2 border-b-[6px] border-slate-300 shadow-sm transition-all active:border-b-2 active:translate-y-[4px] cursor-pointer hover:bg-slate-50"
            >
              {word.text}
            </button>
          ))}
        </div>

        <div className={`absolute bottom-0 left-0 w-full p-6 -mx-6 sm:-mx-8 rounded-t-[2.5rem] transition-transform duration-300 transform ${isChecked ? 'translate-y-0' : 'translate-y-[120%]'} ${isCorrect ? 'bg-emerald-100' : 'bg-red-100'}`}>
           <div className="flex flex-col space-y-4">
             <div className="flex items-start space-x-4">
               <div className={`p-3 rounded-full ${isCorrect ? 'bg-emerald-200 text-emerald-700' : 'bg-red-200 text-red-700'}`}>
                 {isCorrect ? <Check size={32} strokeWidth={3}/> : <X size={32} strokeWidth={3}/>}
               </div>
               <div>
                 <h3 className={`text-2xl font-black ${isCorrect ? 'text-emerald-700' : 'text-red-700'}`}>
                   {isCorrect ? 'Excellent!' : 'Not quite right.'}
                 </h3>
                 <p className={`font-medium ${isCorrect ? 'text-emerald-600' : 'text-red-600'}`}>
                   {isCorrect ? activeChallenge.hint : `Correct answer: ${activeChallenge.target.join(' ')}`}
                 </p>
               </div>
             </div>
             
             <button
               onClick={() => { playSfx('tap'); nextChallenge(); }}
               className={`w-full py-4 rounded-2xl font-black text-xl text-white border-b-[6px] active:border-b-0 active:translate-y-[6px] transition-all ${isCorrect ? 'bg-emerald-500 border-emerald-700 hover:bg-emerald-400' : 'bg-red-500 border-red-700 hover:bg-red-400'}`}
             >
               Continue
             </button>
           </div>
        </div>

        {!isChecked && (
          <button
            onClick={checkAnswer}
            disabled={selectedWords.length === 0}
            className={`w-full py-4 mt-8 rounded-2xl font-black text-xl border-b-[6px] active:border-b-0 active:translate-y-[6px] transition-all ${selectedWords.length > 0 ? 'bg-blue-500 hover:bg-blue-400 text-white border-blue-700' : 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed'}`}
          >
            Check Answer
          </button>
        )}

      </div>
    );
  };

  const ResultsScreen = () => (
    <div className="flex flex-col h-full items-center justify-center text-center animate-in zoom-in-95 duration-500 relative">
      <button onClick={toggleAudio} className={`absolute top-0 right-0 p-2 rounded-xl transition-colors ${audioEnabled ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
        {audioEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
      </button>

      <div className="bg-amber-100 p-8 rounded-full mb-6">
        <Sparkles size={64} className="text-amber-500" />
      </div>
      
      <div className="space-y-4 mb-10">
        <h2 className="text-4xl font-black text-slate-800">Lesson Complete!</h2>
        <p className="text-xl text-slate-600 font-medium">
          You are mastering Toki Pona grammar.
        </p>
        <div className="text-2xl font-bold text-blue-600 bg-blue-50 px-6 py-3 rounded-2xl inline-block border-2 border-blue-100">
          Score: {score} / {challenges.length}
        </div>
      </div>

      <div className="flex flex-col w-full max-w-xs space-y-4">
        <button 
          onClick={startGame}
          className="flex items-center justify-center space-x-2 bg-blue-500 hover:bg-blue-400 text-white p-4 rounded-2xl text-xl font-black border-b-[6px] border-blue-700 active:border-b-0 active:translate-y-[6px] transition-all"
        >
          <RotateCcw size={24} strokeWidth={3} />
          <span>Practice Again</span>
        </button>
        
        <button 
          onClick={() => { playSfx('tap'); setView('menu'); }}
          className="flex items-center justify-center space-x-2 bg-slate-200 hover:bg-slate-300 text-slate-700 p-4 rounded-2xl text-xl font-black border-b-[6px] border-slate-400 active:border-b-0 active:translate-y-[6px] transition-all"
        >
          <span>Main Menu</span>
        </button>
      </div>
    </div>
  );

  const DictionaryScreen = () => (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      <div className="flex items-center space-x-4 mb-6">
        <button onClick={() => { playSfx('untap'); setView('menu'); }} className="p-3 bg-slate-200 hover:bg-slate-300 rounded-xl text-slate-700 transition-colors active:scale-95">
          <ArrowLeft size={24} strokeWidth={3} />
        </button>
        <h2 className="text-3xl font-black text-slate-800">Grammar Rules</h2>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar pr-2 pb-6">
        <section className="bg-blue-50 border-2 border-blue-200 p-5 rounded-2xl">
          <h3 className="font-black text-xl text-blue-800 mb-2">1. Adjectives follow Nouns</h3>
          <p className="text-blue-900 font-medium mb-3">Unlike English, the modifier comes second.</p>
          <div className="bg-white p-3 rounded-xl shadow-sm font-bold text-slate-700">
            jan pona = <span className="text-slate-400 font-normal line-through mr-1">good person</span> <span className="text-blue-600">person good</span>
          </div>
        </section>

        <section className="bg-emerald-50 border-2 border-emerald-200 p-5 rounded-2xl">
          <h3 className="font-black text-xl text-emerald-800 mb-2">2. The magic of "li"</h3>
          <p className="text-emerald-900 font-medium mb-3">If the subject is NOT 'mi' (I) or 'sina' (You), use <strong>li</strong> before the verb.</p>
          <ul className="space-y-2">
            <li className="bg-white p-3 rounded-xl shadow-sm font-bold text-slate-700">
              mi moku (I eat - <span className="text-emerald-600">no 'li'</span>)
            </li>
            <li className="bg-white p-3 rounded-xl shadow-sm font-bold text-slate-700">
              soweli <span className="text-emerald-500 text-xl font-black">li</span> moku (The animal eats)
            </li>
          </ul>
        </section>

        <section className="bg-purple-50 border-2 border-purple-200 p-5 rounded-2xl">
          <h3 className="font-black text-xl text-purple-800 mb-2">3. The object marker "e"</h3>
          <p className="text-purple-900 font-medium mb-3">Put <strong>e</strong> right before the thing being acted upon.</p>
          <div className="bg-white p-3 rounded-xl shadow-sm font-bold text-slate-700">
            mi lukin <span className="text-purple-500 text-xl font-black">e</span> kili (I see the fruit)
          </div>
        </section>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 font-sans flex items-center justify-center p-4">
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
      `}} />

      <div className="bg-white w-full max-w-md h-[800px] max-h-[95vh] rounded-[3rem] shadow-xl overflow-hidden relative border-8 border-slate-200 p-6 sm:p-8 flex flex-col mx-auto">
        {view === 'menu' && <MenuScreen />}
        {view === 'learn' && <LearnScreen />}
        {view === 'results' && <ResultsScreen />}
        {view === 'study' && <DictionaryScreen />}
      </div>
    </div>
  );
}