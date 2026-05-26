const fallbackWords = ["kata", "cepat", "tepat", "latih"] as const;

function getWordSource(wordBank: readonly string[]) {
  return wordBank.length > 0 ? wordBank : fallbackWords;
}

function getSeedHash(seed: string) {
  let hash = 2166136261;

  for (const character of seed) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export function buildWordQueue(
  wordBank: readonly string[],
  size: number,
): string[] {
  const source = getWordSource(wordBank);

  return Array.from({ length: size }, () => {
    const index = Math.floor(Math.random() * source.length);
    return source[index];
  });
}

export function buildStableWordQueue(
  wordBank: readonly string[],
  size: number,
  seed: string,
): string[] {
  const source = getWordSource(wordBank);
  let state = getSeedHash(seed) || 1;

  return Array.from({ length: size }, () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return source[state % source.length];
  });
}
