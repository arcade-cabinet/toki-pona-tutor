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
export function toSitelenPona(sentence: string): string {
  return sentence
    .split(/(\s+)/)
    .map((token) => {
      // Strip punctuation from match but reassemble
      const match = token.match(/^([.,!?"']*)([a-zA-Z]+)([.,!?"']*)$/);
      if (!match) return token;
      const [, pre, word, post] = match;
      const glyph = sitelenFor(word.toLowerCase());
      return glyph ? `${pre}${glyph}${post}` : token;
    })
    .join('');
}
