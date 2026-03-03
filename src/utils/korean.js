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
 * 문자열을 자모 배열로 분해 (역할 정보 포함)
 * @param {string} str - 한글 문자열
 * @returns {{ char: string, role: string }[]} 역할 태그가 붙은 자모 배열
 */
export function decomposeStringWithRoles(str) {
  const result = [];
  for (const char of str) {
    const parts = decompose(char);
    if (parts) {
      result.push({ char: parts.cho, role: 'cho' });
      result.push({ char: parts.jung, role: 'jung' });
      if (parts.jong) result.push({ char: parts.jong, role: 'jong' });
    } else {
      result.push({ char, role: 'other' });
    }
  }
  return result;
}

/**
 * 자모 카드를 역할별로 셔플하여 항상 유효한 음절을 형성
 * @param {Array} cards - { id, char, role } 카드 배열
 * @returns {Array} 셔플된 카드 배열
 */
export function jamoShuffle(cards) {
  const choCards = [];
  const jungCards = [];
  const jongCards = [];
  const otherCards = [];

  for (const card of cards) {
    switch (card.role) {
      case 'cho': choCards.push(card); break;
      case 'jung': jungCards.push(card); break;
      case 'jong': jongCards.push(card); break;
      default: otherCards.push(card); break;
    }
  }

  // Fisher-Yates 셔플
  const shuffleArr = (arr) => {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };

  const shuffledCho = shuffleArr(choCards);
  const shuffledJung = shuffleArr(jungCards);
  const shuffledJong = shuffleArr(jongCards);

  const numSyllables = Math.min(shuffledCho.length, shuffledJung.length);

  // 종성을 랜덤 음절 위치에 배분
  const jongSlots = new Array(numSyllables).fill(false);
  for (let i = 0; i < Math.min(shuffledJong.length, numSyllables); i++) {
    jongSlots[i] = true;
  }
  const shuffledSlots = shuffleArr(jongSlots);

  const result = [];
  let jongIdx = 0;
  let cardIdx = 0;

  for (let i = 0; i < numSyllables; i++) {
    result.push({ ...shuffledCho[i], id: `card-${cardIdx++}` });
    result.push({ ...shuffledJung[i], id: `card-${cardIdx++}` });
    if (shuffledSlots[i] && jongIdx < shuffledJong.length) {
      result.push({ ...shuffledJong[jongIdx++], id: `card-${cardIdx++}` });
    }
  }

  for (const card of otherCards) {
    result.push({ ...card, id: `card-${cardIdx++}` });
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

// 한국 성씨 목록 (통계청 기준 주요 성씨)
const KOREAN_SURNAMES = [
  '김','이','박','최','정','강','조','윤','장','임',
  '한','오','서','신','권','황','안','송','류','전',
  '홍','유','고','문','양','손','배','백','허','노',
  '남','하','심','주','구','곽','성','차','우','민',
  '진','나','지','엄','변','추','도','소','석','선',
  '설','마','길','연','방','위','표','명','기','반',
  '왕','금','옥','육','인','맹','제','모','탁','국',
  '여','봉','편','함','사','예','경','피','감','태',
  '원','천','공','현','염','복','목','형','피','두',
  '라','탄','요','범','어','을','빈','용','승','판',
  '루','궁','동','채','린','섭','독','만','증','평',
  '빙','란','상','초','시','풍','근','옹','단','관',
];

/**
 * 한국 이름으로 추정되는지 확인
 * 조건: 2~3글자, 모두 한글, 첫 글자가 성씨
 */
export function isPossibleKoreanName(word) {
  const chars = [...word];
  if (chars.length < 2 || chars.length > 3) return false;
  if (!chars.every(isHangul)) return false;
  return KOREAN_SURNAMES.includes(chars[0]);
}

/**
 * 글자 배열의 모든 순열 생성 (최대 3글자용)
 */
function getPermutations(arr) {
  if (arr.length <= 1) return [arr];
  const result = [];
  for (let i = 0; i < arr.length; i++) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    for (const perm of getPermutations(rest)) {
      result.push([arr[i], ...perm]);
    }
  }
  return result;
}

/**
 * 입력 글자로 만들 수 있는 이름 추정 결과 반환
 * @param {string} input - 입력 단어
 * @returns {string[]} 이름으로 추정되는 조합들
 */
export function findPossibleNames(input) {
  const chars = [...input.replace(/\s/g, '')];
  // 2~3글자만 처리 (순열 수가 적으므로)
  if (chars.length < 2 || chars.length > 3) return [];
  if (!chars.every(isHangul)) return [];

  const perms = getPermutations(chars);
  const seen = new Set();
  const names = [];

  for (const perm of perms) {
    const word = perm.join('');
    if (word === input) continue; // 원본 제외
    if (seen.has(word)) continue;
    seen.add(word);
    if (isPossibleKoreanName(word)) {
      names.push(word);
    }
  }

  return names;
}

// 한국어 고유명사 (장소, 국가 등)
const KOREAN_PLACES = [
  // 한국 시/도
  '서울','부산','대구','인천','광주','대전','울산','세종',
  '수원','성남','안양','안산','용인','화성','평택','시흥','파주','김포','고양','과천',
  '의왕','군포','하남','이천','여주','양평','광명','구리','남양','오산','의정',
  '춘천','원주','강릉','속초','동해','삼척','태백','정선','영월','횡성','홍천','철원','양구','인제','고성','양양',
  '청주','충주','제천','보은','옥천','영동','증평','진천','괴산','음성','단양',
  '천안','공주','보령','아산','서산','논산','계룡','당진','금산','부여','서천','청양','홍성','예산','태안',
  '전주','군산','익산','정읍','남원','김제','완주','진안','무주','장수','임실','순창','고창','부안',
  '목포','여수','순천','나주','광양','담양','곡성','구례','고흥','보성','화순','장흥','강진','해남','영암','무안','함평','영광','장성','완도','진도','신안',
  '포항','경주','김천','안동','구미','영주','영천','상주','문경','경산','군위','의성','청송','영양','영덕','청도','고령','성주','칠곡','예천','봉화','울진','울릉',
  '창원','진주','통영','사천','김해','밀양','거제','양산','의령','함안','창녕','고성','남해','하동','산청','함양','거창','합천',
  '제주','서귀',
  // 한국 도
  '경기','강원','충북','충남','전북','전남','경북','경남',
  // 국가
  '한국','북한','미국','중국','일본','영국','독일','프랑스','호주','인도',
  '러시아','캐나다','브라질','멕시코','이탈리아','스페인','터키','이란','이라크',
  '태국','베트남','말레이시아','인도네시아','필리핀','싱가포르','대만',
  '네덜란드','벨기에','스위스','스웨덴','노르웨이','덴마크','핀란드',
  '폴란드','체코','헝가리','루마니아','그리스','포르투갈',
  '이집트','남아프리카','나이지리아','케냐','에티오피아',
  '아르헨티나','칠레','콜롬비아','페루','쿠바',
  '사우디아라비아','아랍에미리트','카타르','쿠웨이트','이스라엘',
  '파키스탄','방글라데시','미얀마','캄보디아','라오스','몽골','네팔',
  '뉴질랜드','피지',
  // 주요 해외 도시
  '도쿄','오사카','베이징','상하이','홍콩','마카오',
  '뉴욕','런던','파리','로마','베를린','모스크바',
  '방콕','하노이','자카르타','마닐라','쿠알라룸푸르',
  '시드니','멜버른','토론토','밴쿠버',
  // 기타 지명
  '독도','울릉도','제주도','한라산','백두산','지리산','설악산',
  '한강','낙동강','금강','영산강',
  '아시아','유럽','아프리카','오세아니아',
];

/**
 * 고유명사(장소/국가)로 추정되는지 확인
 */
export function isPossiblePlace(word) {
  return KOREAN_PLACES.includes(word);
}

/**
 * 입력 글자로 만들 수 있는 장소/국가 이름 반환
 */
export function findPossiblePlaces(input) {
  const chars = [...input.replace(/\s/g, '')];
  if (chars.length < 2 || chars.length > 5) return [];
  if (!chars.every(isHangul)) return [];

  const perms = getPermutations(chars);
  const seen = new Set();
  const places = [];

  for (const perm of perms) {
    const word = perm.join('');
    if (word === input) continue;
    if (seen.has(word)) continue;
    seen.add(word);
    if (isPossiblePlace(word)) {
      places.push(word);
    }
  }

  return places;
}

/**
 * 자모 풀에서 가능한 모든 한글 문자열 생성 (모든 자모를 소진해야 함)
 * @param {string[]} consonants - 사용 가능한 자음 풀
 * @param {string[]} vowels - 사용 가능한 모음 풀
 * @returns {string[]} 가능한 문자열들
 */
function generateAllWords(consonants, vowels) {
  if (vowels.length === 0) {
    return consonants.length === 0 ? [''] : [];
  }

  const results = [];
  const usedCho = new Set();

  for (let ci = 0; ci < consonants.length; ci++) {
    if (usedCho.has(consonants[ci])) continue;
    usedCho.add(consonants[ci]);

    const cho = consonants[ci];
    const remCons = [...consonants.slice(0, ci), ...consonants.slice(ci + 1)];

    const usedJung = new Set();
    for (let vi = 0; vi < vowels.length; vi++) {
      if (usedJung.has(vowels[vi])) continue;
      usedJung.add(vowels[vi]);

      const jung = vowels[vi];
      const remVows = [...vowels.slice(0, vi), ...vowels.slice(vi + 1)];

      // 종성 없이
      if (remCons.length <= remVows.length * 2 && remCons.length >= remVows.length) {
        const char = composeFromJamo(cho, jung, '');
        if (char) {
          for (const suffix of generateAllWords(remCons, remVows)) {
            results.push(char + suffix);
          }
        }
      }

      // 종성 있게
      const usedJong = new Set();
      for (let ji = 0; ji < remCons.length; ji++) {
        if (usedJong.has(remCons[ji])) continue;
        usedJong.add(remCons[ji]);

        const jong = remCons[ji];
        if (!JONG.includes(jong)) continue;

        const remConsAfterJong = [...remCons.slice(0, ji), ...remCons.slice(ji + 1)];
        if (remConsAfterJong.length > remVows.length * 2 || remConsAfterJong.length < remVows.length) continue;

        const char = composeFromJamo(cho, jung, jong);
        if (char) {
          for (const suffix of generateAllWords(remConsAfterJong, remVows)) {
            results.push(char + suffix);
          }
        }
      }
    }
  }

  return results;
}

/**
 * 자모 재조합으로 이름 추정 결과 찾기
 * @param {string} input - 입력 단어
 * @returns {string[]} 이름으로 추정되는 조합들
 */
export function findJamoNameAnagrams(input) {
  const chars = [...input.replace(/\s/g, '')];
  if (!chars.every(isHangul)) return [];

  const consonants = [];
  const vowels = [];
  for (const char of chars) {
    const parts = decompose(char);
    if (parts) {
      consonants.push(parts.cho);
      vowels.push(parts.jung);
      if (parts.jong) consonants.push(parts.jong);
    }
  }

  if (vowels.length < 2 || vowels.length > 3) return [];

  const results = new Set();

  for (const surname of KOREAN_SURNAMES) {
    const sp = decompose(surname);
    if (!sp) continue;

    const tempCons = [...consonants];
    const tempVows = [...vowels];

    // 성씨에 필요한 자모 추출
    const choIdx = tempCons.indexOf(sp.cho);
    if (choIdx === -1) continue;
    tempCons.splice(choIdx, 1);

    const jungIdx = tempVows.indexOf(sp.jung);
    if (jungIdx === -1) continue;
    tempVows.splice(jungIdx, 1);

    if (sp.jong) {
      const jongIdx = tempCons.indexOf(sp.jong);
      if (jongIdx === -1) continue;
      tempCons.splice(jongIdx, 1);
    }

    // 나머지 자모로 이름 부분 (1~2음절) 생성 가능한지 확인
    if (tempVows.length < 1 || tempVows.length > 2) continue;
    if (tempCons.length < tempVows.length || tempCons.length > tempVows.length * 2) continue;

    const givenNames = generateAllWords(tempCons, tempVows);
    for (const gn of givenNames) {
      const fullName = surname + gn;
      if (fullName !== input) {
        results.add(fullName);
      }
    }
  }

  return [...results];
}

/**
 * 자모 재조합으로 장소/국가 찾기
 * 입력 단어와 같은 자모 구성인 장소명 검색
 * @param {string} input - 입력 단어
 * @returns {string[]} 장소/국가 목록
 */
export function findJamoPlaceAnagrams(input) {
  const chars = [...input.replace(/\s/g, '')];
  if (!chars.every(isHangul)) return [];

  const inputJamoKey = decomposeString(input.replace(/\s/g, '')).sort().join('');

  const results = [];
  for (const place of KOREAN_PLACES) {
    if (place === input) continue;
    const placeJamoKey = decomposeString(place).sort().join('');
    if (placeJamoKey === inputJamoKey) {
      results.push(place);
    }
  }

  return results;
}

export { CHO, JUNG, JONG, KOREAN_SURNAMES, KOREAN_PLACES };
