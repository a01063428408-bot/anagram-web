// 한글 유니코드 자모 분해/조합 유틸리티

const HANGUL_START = 0xAC00;
const HANGUL_END = 0xD7A3;

// 초성 19개
const CHO = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
// 중성 21개
const JUNG = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ'];
// 종성 28개 (첫 번째는 종성 없음)
const JONG = ['','ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];

/**
 * 한글 문자인지 확인
 */
export function isHangul(char) {
  const code = char.charCodeAt(0);
  return code >= HANGUL_START && code <= HANGUL_END;
}

/**
 * 문자열이 한글을 포함하는지 확인
 */
export function containsHangul(str) {
  return [...str].some(isHangul);
}

/**
 * 한글 한 글자를 초성, 중성, 종성으로 분해
 * @param {string} char - 한글 한 글자
 * @returns {{ cho: string, jung: string, jong: string }} 분해된 자모
 */
export function decompose(char) {
  if (!isHangul(char)) return null;

  const code = char.charCodeAt(0) - HANGUL_START;
  const choIdx = Math.floor(code / (21 * 28));
  const jungIdx = Math.floor((code % (21 * 28)) / 28);
  const jongIdx = code % 28;

  return {
    cho: CHO[choIdx],
    jung: JUNG[jungIdx],
    jong: JONG[jongIdx]
  };
}

/**
 * 초성, 중성, 종성 인덱스로 한글 한 글자 조합
 */
export function compose(choIdx, jungIdx, jongIdx) {
  return String.fromCharCode(HANGUL_START + choIdx * 21 * 28 + jungIdx * 28 + jongIdx);
}

/**
 * 자모 문자로 한글 한 글자 조합
 */
export function composeFromJamo(cho, jung, jong = '') {
  const choIdx = CHO.indexOf(cho);
  const jungIdx = JUNG.indexOf(jung);
  const jongIdx = JONG.indexOf(jong);

  if (choIdx === -1 || jungIdx === -1 || jongIdx === -1) return null;
  return compose(choIdx, jungIdx, jongIdx);
}

/**
 * 문자열을 자모 배열로 분해
 * @param {string} str - 한글 문자열
 * @returns {string[]} 자모 배열
 */
export function decomposeString(str) {
  const result = [];
  for (const char of str) {
    const parts = decompose(char);
    if (parts) {
      result.push(parts.cho, parts.jung);
      if (parts.jong) result.push(parts.jong);
    } else {
      result.push(char);
    }
  }
  return result;
}

/**
 * 자모 배열을 한글 문자열로 재조합
 * 초성+중성(+종성) 패턴을 자동 인식
 * @param {string[]} jamo - 자모 배열
 * @returns {string} 조합된 문자열
 */
export function recomposeFromJamo(jamo) {
  let result = '';
  let i = 0;

  while (i < jamo.length) {
    const current = jamo[i];

    // 초성인지 확인
    if (CHO.includes(current)) {
      // 다음이 중성인지 확인
      if (i + 1 < jamo.length && JUNG.includes(jamo[i + 1])) {
        const cho = current;
        const jung = jamo[i + 1];

        // 그 다음이 종성인지 확인 (종성 뒤에 중성이 오지 않는 경우만)
        if (
          i + 2 < jamo.length &&
          JONG.includes(jamo[i + 2]) &&
          jamo[i + 2] !== '' &&
          // 다음 글자의 초성+중성이 올 수 있는지 확인
          !(i + 3 < jamo.length && JUNG.includes(jamo[i + 3]))
        ) {
          const composed = composeFromJamo(cho, jung, jamo[i + 2]);
          result += composed || (cho + jung + jamo[i + 2]);
          i += 3;
        } else {
          const composed = composeFromJamo(cho, jung, '');
          result += composed || (cho + jung);
          i += 2;
        }
      } else {
        result += current;
        i++;
      }
    } else {
      result += current;
      i++;
    }
  }

  return result;
}

/**
 * 글자 단위로 문자열을 배열로 분리
 */
export function splitByChar(str) {
  return [...str];
}

/**
 * 자모가 초성인지 확인
 */
export function isCho(char) {
  return CHO.includes(char);
}

/**
 * 자모가 중성인지 확인
 */
export function isJung(char) {
  return JUNG.includes(char);
}

/**
 * 자모가 종성인지 확인
 */
export function isJong(char) {
  return JONG.includes(char) && char !== '';
}

export { CHO, JUNG, JONG };
