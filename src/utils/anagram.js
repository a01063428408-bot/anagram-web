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

/**
 * 글자 빈도 맵 생성
 */
function getFreqMap(chars) {
  const map = new Map();
  for (const ch of chars) {
    map.set(ch, (map.get(ch) || 0) + 1);
  }
  return map;
}

/**
 * keyFreq의 모든 글자가 inputFreq에 충분한 수로 존재하는지 확인
 */
function isSubsetFreq(keyChars, inputFreq) {
  const keyFreq = new Map();
  for (const ch of keyChars) {
    const count = (keyFreq.get(ch) || 0) + 1;
    keyFreq.set(ch, count);
    if (count > (inputFreq.get(ch) || 0)) return false;
  }
  return true;
}

/**
 * 부분 애너그램 찾기 - 입력 글자의 일부를 사용하는 사전 단어
 * @param {string} input - 입력 단어
 * @param {Map<string, string[]>} index - 사전 인덱스
 * @param {string} mode - 'char' 또는 'jamo'
 * @param {number} minLength - 최소 글자 수
 * @param {number} maxResults - 최대 결과 수
 * @returns {string[]} 부분 애너그램 결과
 */
export function findSubsetAnagrams(input, index, mode = 'char', minLength = 2, maxResults = 50) {
  const cleaned = input.replace(/\s/g, '').toLowerCase();
  const inputKey = getSortKey(input, mode);
  const inputChars = mode === 'jamo' ? decomposeString(cleaned) : splitByChar(cleaned);
  const inputFreq = getFreqMap(inputChars);
  const inputLen = inputChars.length;

  const results = [];
  const seen = new Set();

  for (const [key, words] of index) {
    // 완전 일치는 건너뛰기 (일반 애너그램에서 이미 처리)
    if (key === inputKey) continue;
    // 키 길이 제한
    const keyChars = [...key];
    if (keyChars.length < minLength || keyChars.length >= inputLen) continue;

    // 부분집합 빈도 확인
    if (isSubsetFreq(keyChars, inputFreq)) {
      for (const word of words) {
        const lower = word.toLowerCase();
        if (!seen.has(lower)) {
          seen.add(lower);
          results.push(word);
        }
      }
    }
    if (results.length >= maxResults * 2) break;
  }

  // 긴 단어 우선 정렬
  results.sort((a, b) => b.length - a.length);
  return results.slice(0, maxResults);
}

/**
 * 복합어 분해 - 입력 글자를 2~3개 사전 단어로 분할
 * @param {string} input - 입력 단어
 * @param {Map<string, string[]>} index - 사전 인덱스
 * @param {string} mode - 'char' 또는 'jamo'
 * @returns {string[][]} 복합어 조합 배열 (예: [["강남","역삼"]])
 */
export function findCompoundSplits(input, index, mode = 'char') {
  const cleaned = input.replace(/\s/g, '').toLowerCase();
  const chars = mode === 'jamo' ? decomposeString(cleaned) : splitByChar(cleaned);

  if (chars.length < 4 || chars.length > (mode === 'jamo' ? 18 : 6)) return [];

  const results = [];
  const seen = new Set();

  // 글자 인덱스의 모든 부분집합 조합을 시도 (비트마스크)
  // 성능을 위해 글자 수 제한
  const n = chars.length;
  const maxMask = 1 << n;

  for (let mask = 1; mask < maxMask - 1; mask++) {
    // 첫 번째 그룹: mask에 해당하는 글자들
    const group1 = [];
    const group2 = [];
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) group1.push(chars[i]);
      else group2.push(chars[i]);
    }

    if (group1.length < 2 || group2.length < 2) continue;

    const key1 = group1.sort().join('');
    const key2 = group2.sort().join('');

    const words1 = index.get(key1);
    const words2 = index.get(key2);

    if (words1 && words2) {
      // 각 조합에서 대표 단어 1개씩만 (중복 방지)
      for (const w1 of words1.slice(0, 3)) {
        for (const w2 of words2.slice(0, 3)) {
          const combo = [w1, w2].sort().join('+');
          if (!seen.has(combo)) {
            seen.add(combo);
            results.push([w1, w2]);
          }
        }
      }
    }

    if (results.length >= 30) break;
  }

  return results;
}
