const HANGUL_START = 0xac00;
const HANGUL_END = 0xd7a3;
const FINAL_CONSONANT_COUNT = 28;

export const topicParticle = (word: string): string => {
  const code = word.charCodeAt(word.length - 1);
  if (Number.isNaN(code) || code < HANGUL_START || code > HANGUL_END) return "은(는)";
  return (code - HANGUL_START) % FINAL_CONSONANT_COUNT === 0 ? "는" : "은";
};
