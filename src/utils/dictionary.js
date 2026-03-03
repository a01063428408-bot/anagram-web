import { buildIndex } from './anagram';

/**
 * 사전 데이터를 로드하고 인덱스를 생성
 * @param {string} language - 'en' 또는 'ko'
 * @returns {Promise<{ words: string[], wordSet: Set<string>, charIndex: Map, jamoIndex: Map }>}
 */
export async function loadDictionary(language) {
  const response = await fetch(`/dictionaries/${language}.json`);
  if (!response.ok) {
    throw new Error(`사전 로드 실패: ${language}`);
  }

  const words = await response.json();
  const wordSet = new Set(words.map(w => w.toLowerCase()));
  const charIndex = buildIndex(words, 'char');

  // 한국어일 때만 자모 인덱스도 생성
  let jamoIndex = null;
  if (language === 'ko') {
    jamoIndex = buildIndex(words, 'jamo');
  }

  return { words, wordSet, charIndex, jamoIndex };
}
