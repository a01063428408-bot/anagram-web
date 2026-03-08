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
  let neologismCharIndex = null;
  let neologismJamoIndex = null;
  let nameCharIndex = null;
  let nameJamoIndex = null;
  let givenNameSet = null;
  if (language === 'ko') {
    jamoIndex = buildIndex(words, 'jamo');

    // 신조어/줄임말 로드
    try {
      const neoResponse = await fetch('/dictionaries/ko-neologisms.json');
      if (neoResponse.ok) {
        const neoWords = await neoResponse.json();
        neologismCharIndex = buildIndex(neoWords, 'char');
        neologismJamoIndex = buildIndex(neoWords, 'jamo');
      }
    } catch (e) {
      // 신조어 로드 실패 시 무시
    }

    // 한국인 이름 데이터 로드
    try {
      const [namesRes, givenRes] = await Promise.all([
        fetch('/dictionaries/ko-names.json'),
        fetch('/dictionaries/ko-given-names.json'),
      ]);
      if (namesRes.ok) {
        const nameWords = await namesRes.json();
        nameCharIndex = buildIndex(nameWords, 'char');
        nameJamoIndex = buildIndex(nameWords, 'jamo');
      }
      if (givenRes.ok) {
        const givenWords = await givenRes.json();
        givenNameSet = new Set(givenWords);
      }
    } catch (e) {
      // 이름 로드 실패 시 무시
    }
  }

  return { words, wordSet, charIndex, jamoIndex, neologismCharIndex, neologismJamoIndex, nameCharIndex, nameJamoIndex, givenNameSet };
}
