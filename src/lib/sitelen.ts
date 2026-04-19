import { dictionary } from './challenges';

// Convert 'U+F1908' → actual Unicode string '' that renders with nasin-nanpa.
export function ucsurStringToChar(ucsur: string): string {
  if (!ucsur) return '';
  const hex = ucsur.replace(/^U\+/i, '');
  const code = parseInt(hex, 16);
  if (Number.isNaN(code)) return '';
  return String.fromCodePoint(code);
}

const ucsurByWord = new Map<string, string>();
for (const entry of dictionary) {
  if (entry.ucsur) ucsurByWord.set(entry.word, ucsurStringToChar(entry.ucsur));
}

// Particles (li, e, la, pi) and pronouns all have sitelen pona glyphs too.
export function sitelenFor(word: string): string {
  return ucsurByWord.get(word) ?? '';
}

// Render an entire TP sentence in sitelen pona, preserving word spacing.
// Unknown words (proper names etc) pass through unchanged.
//
// IMPORTANT: sitelen pona has glyphs for the single-letter words "a", "e",
// "o" — which collide with keyboard key names (W A S D, the E interact key,
// exclamations like "Oh!" in English). We guard against accidental rendering
// by (a) never substituting uppercase tokens — TP is always lowercase — and
// (b) skipping short words inside strings that look like keyboard
// instructions (contain 2+ capital letters in a row like "WASD" or "ABXY").
export function toSitelenPona(sentence: string): string {
  const looksLikeKeyboardHint = /\b[A-Z]{2,}\b/.test(sentence);
  return sentence
    .split(/(\s+)/)
    .map((token) => {
      // Strip punctuation from match but reassemble
      const match = token.match(/^([.,!?"']*)([a-zA-Z]+)([.,!?"']*)$/);
      if (!match) return token;
      const [, pre, word, post] = match;
      // Only substitute tokens that are already lowercase TP. Uppercase
      // letters are treated as literals (keyboard keys, acronyms, titles).
      if (word !== word.toLowerCase()) return token;
      // Single-letter TP words (a/e/o) only render when surrounded by
      // lowercase context; keyboard-hint strings bypass them entirely.
      if (word.length === 1 && looksLikeKeyboardHint) return token;
      const glyph = sitelenFor(word);
      return glyph ? `${pre}${glyph}${post}` : token;
    })
    .join('');
}
