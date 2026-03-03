import { decomposeString, splitByChar } from './korean';

/**
 * 문자열의 정렬 키를 생성 (애너그램 비교용)
 * @param {string} word - 단어
 * @param {string} mode - 'char' (글자 단위) 또는 'jamo' (자모 단위)
 * @returns {string} 정렬된 키
 */
export function getSortKey(word, mode = 'char') {
  const cleaned = word.replace(/\s/g, '').toLowerCase();

  if (mode === 'jamo') {
    return decomposeString(cleaned).sort().join('');
  }
  return splitByChar(cleaned).sort().join('');
}

/**
 * 두 단어가 애너그램인지 확인
 */
export function isAnagram(word1, word2, mode = 'char') {
  if (word1.replace(/\s/g, '').length !== word2.replace(/\s/g, '').length && mode === 'char') {
    return false;
  }
  return getSortKey(word1, mode) === getSortKey(word2, mode);
}

/**
 * 사전 인덱스를 생성 (정렬 키 → 단어 목록 매핑)
 * @param {string[]} words - 단어 목록
 * @param {string} mode - 'char' 또는 'jamo'
 * @returns {Map<string, string[]>} 인덱스
 */
export function buildIndex(words, mode = 'char') {
  const index = new Map();

  for (const word of words) {
    const key = getSortKey(word, mode);
    if (!index.has(key)) {
      index.set(key, []);
    }
    index.get(key).push(word);
  }

  return index;
}

/**
 * 사전에서 애너그램 찾기
 * @param {string} input - 입력 단어
 * @param {Map<string, string[]>} index - 사전 인덱스
 * @param {string} mode - 'char' 또는 'jamo'
 * @returns {string[]} 애너그램 결과
 */
export function findAnagrams(input, index, mode = 'char') {
  const key = getSortKey(input, mode);
  const results = index.get(key) || [];

  // 입력 단어 자체는 제외
  const cleaned = input.replace(/\s/g, '').toLowerCase();
  return results.filter(w => w.toLowerCase() !== cleaned);
}

/**
 * 글자 배열을 랜덤으로 셔플 (Fisher-Yates)
 * @param {any[]} arr - 배열
 * @returns {any[]} 셔플된 새 배열
 */
export function shuffle(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * 단어가 사전에 존재하는지 확인
 */
export function isValidWord(word, wordSet) {
  return wordSet.has(word.toLowerCase());
}
