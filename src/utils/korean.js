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
 * 한국 이름으로 추정되는지 확인 (givenNameSet 기반)
 * givenNameSet이 없으면 기존 음절 기반으로 fallback
 * @param {string} word - 확인할 단어
 * @param {Set<string>} [givenNameSet] - 실제 이름 데이터 Set
 */
export function isPossibleKoreanName(word, givenNameSet) {
  const chars = [...word];
  if (chars.length < 2 || chars.length > 3) return false;
  if (!chars.every(isHangul)) return false;
  if (!KOREAN_SURNAMES.includes(chars[0])) return false;
  const givenName = chars.slice(1).join('');

  // 실제 이름 데이터가 있으면 정확한 매칭
  if (givenNameSet) {
    return givenNameSet.has(givenName);
  }
  // fallback: 기존 음절 기반
  return [...givenName].every(ch => KOREAN_NAME_SYLLABLES.has(ch));
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
 * @param {Set<string>} [givenNameSet] - 실제 이름 데이터 Set
 * @returns {string[]} 이름으로 추정되는 조합들
 */
export function findPossibleNames(input, givenNameSet) {
  const chars = [...input.replace(/\s/g, '')];
  if (chars.length < 2 || chars.length > 3) return [];
  if (!chars.every(isHangul)) return [];

  const perms = getPermutations(chars);
  const seen = new Set();
  const names = [];

  for (const perm of perms) {
    const word = perm.join('');
    if (word === input) continue;
    if (seen.has(word)) continue;
    seen.add(word);
    if (isPossibleKoreanName(word, givenNameSet)) {
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
 * @param {Set<string>} [givenNameSet] - 실제 이름 데이터 Set
 * @returns {string[]} 이름으로 추정되는 조합들
 */
export function findJamoNameAnagrams(input, givenNameSet) {
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

    if (tempVows.length < 1 || tempVows.length > 2) continue;
    if (tempCons.length < tempVows.length || tempCons.length > tempVows.length * 2) continue;

    const givenNames = generateAllWords(tempCons, tempVows);
    for (const gn of givenNames) {
      // givenNameSet이 있으면 실제 이름 데이터로 검증, 없으면 기존 방식
      const isValid = givenNameSet ? givenNameSet.has(gn) : isRealisticGivenName(gn);
      if (!isValid) continue;
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

// 실제 한국인 이름에서 자주 사용되는 이름 글자 (약 287개)
// 통계청 인기 이름, 인명용 한자표, 순우리말 이름 분석 기반
const KOREAN_NAME_SYLLABLES = new Set([
  "가","각","간","갈","감","갑","강","개","거","건","걸","검","격","견","결","겸","경","계","고",
  "곡","곤","곧","공","과","곽","관","광","굉","교","구","국","군","권","귀","규","균","극","근",
  "글","금","급","긍","기","길","꽃","꿈","나","낙","난","남","납","내","녀","녕","노","녹","누",
  "늘","능","님","다","단","달","담","답","당","대","덕","도","독","돈","돌","동","두","둔","득",
  "든","라","란","람","랑","래","램","량","려","력","련","렬","령","로","록","료","룡","루","류",
  "름","리","린","립","마","만","말","망","매","맹","명","모","목","몽","묘","무","묵","문","미",
  "민","바","박","반","발","배","백","범","벽","별","병","보","복","봄","봉","부","비","빈","빛",
  "사","산","삼","상","새","샘","생","서","석","선","설","섬","섭","성","세","소","솔","솜","송",
  "수","숙","순","숭","슬","습","승","시","식","신","실","심","쌍","아","악","안","애","야","약",
  "양","억","언","얼","엄","여","연","염","엽","영","예","오","옥","온","올","옹","와","완","왕",
  "요","용","우","욱","운","웅","원","월","위","유","윤","율","은","을","음","응","의","이","인",
  "일","자","작","장","재","전","절","점","정","제","조","종","주","준","중","지","직","진","찬",
  "참","창","채","척","천","철","첨","초","추","춘","출","충","치","탁","탄","태","택","토","통",
  "파","판","팔","평","포","표","풀","품","풍","필","하","학","한","함","합","항","해","향","허",
  "헌","혁","현","협","형","혜","호","혼","홍","화","환","황","회","효","후","훈","휘","흠","흥",
  "희","힘"
]);

/**
 * 이름의 글자(given name 부분)가 실제 한국 이름에서 흔한 글자인지 확인
 * @param {string} givenName - 이름 부분 (성씨 제외)
 * @returns {boolean}
 */
function isRealisticGivenName(givenName) {
  const chars = [...givenName];
  return chars.every(ch => KOREAN_NAME_SYLLABLES.has(ch));
}

// 한국 주소/위치 (구, 동, 주요 지역명)
const KOREAN_ADDRESSES = [
  // 서울 구
  '강남구','강동구','강북구','강서구','관악구','광진구','구로구','금천구',
  '노원구','도봉구','동대문구','동작구','마포구','서대문구','서초구','성동구',
  '성북구','송파구','양천구','영등포구','용산구','은평구','종로구','중구','중랑구',
  // 부산 구
  '해운대구','수영구','사하구','동래구','남구','북구','사상구','연제구',
  '금정구','부산진구','영도구','기장군',
  // 인천 구
  '남동구','부평구','계양구','미추홀구','연수구','서구',
  // 대구 구
  '수성구','달서구','달성군',
  // 대전 구
  '유성구','대덕구',
  // 광주 구
  '광산구',
  // 서울 주요 동/지역
  '강남','서초','잠실','여의도','명동','홍대','이태원','신촌','건대','합정',
  '망원','성수','한남','압구정','청담','삼성','역삼','논현','신사','방배',
  '잠원','반포','양재','개포','대치','도곡','일원','수서','가락','문정',
  '장지','위례','천호','길동','암사','둔촌','고덕','상일','미아','수유',
  '쌍문','번동','창동','도봉','방학','우이','왕십리','답십리','장안','전농',
  '이문','휘경','회기','청량리','제기','신당','약수','금호','옥수','한남',
  '보광','이촌','동빙고','서빙고','후암','남영','효창','공덕','아현','대흥',
  '신수','상수','망원','연남','성산','상암','불광','녹번','갈현','구산',
  '대조','응암','역촌','증산','수색','신도림','구로','가산','독산','시흥',
  '관악','신림','봉천','낙성대','사당','이수','동작','노량진','흑석','상도',
  '영등포','당산','문래','양평','선유','목동','신정','신월','화곡','발산',
  '방화','개화','마곡','가양','등촌','염창','신목','양화','잠실새내',
  // 경기 주요 지역
  '분당','판교','광교','동탄','위례','일산','운정','산본','평촌','범계',
  '정자','미금','수내','서현','야탑','모란','죽전','수지','기흥','영통',
  '매탄','망포','세류','매교','행궁','능행','병점','오산','진위','송탄',
  // 부산 주요 동/지역
  '해운대','광안리','센텀','남포동','서면','부전','연산','사직','온천',
  '덕천','구포','하단','괴정','대연','용호','부곡','장산','송정',
  // 기타 주요 지역명
  '해방촌','경리단','익선','을지로','종로','광화문','북촌','삼청','인사',
  '대학로','혜화','동묘','신설','보문','안암','고려대','성신','길음',
  '돈암','정릉','삼선','동선','월곡','종암','상월곡','하월곡','석관',
  // 주요 도로/장소
  '테헤란로','강남대로','올림픽대로','세종대로','종로',
  // 주요 랜드마크/복합시설
  '코엑스','잠실','여의도','광화문','남산','북한산','관악산','도봉산',
  '수락산','불암산','아차산','용마산','인왕산','안산','매봉산',
];

/**
 * 주소/위치 관련 접미사 패턴 확인
 * '구', '동', '리', '면', '읍', '로', '길', '대로', '가' 등으로 끝나는 패턴
 */
const ADDRESS_SUFFIXES = ['구', '동', '리', '면', '읍', '로', '길', '가', '산', '역'];

/**
 * 주소/위치로 추정되는지 확인
 */
export function isPossibleAddress(word) {
  if (KOREAN_ADDRESSES.includes(word)) return true;
  // 2글자 이상이고 주소 접미사로 끝나는 경우
  if (word.length >= 2 && [...word].every(isHangul)) {
    return ADDRESS_SUFFIXES.some(suffix => word.endsWith(suffix) && word.length >= suffix.length + 1);
  }
  return false;
}

/**
 * 입력 글자로 만들 수 있는 주소/위치 반환 (글자 단위)
 */
export function findPossibleAddresses(input) {
  const chars = [...input.replace(/\s/g, '')];
  if (chars.length < 2 || chars.length > 6) return [];
  if (!chars.every(isHangul)) return [];

  const results = new Set();

  // 1. KOREAN_ADDRESSES 목록에서 애너그램 찾기
  const inputSorted = [...chars].sort().join('');
  for (const addr of KOREAN_ADDRESSES) {
    if (addr === input) continue;
    const addrChars = [...addr];
    if (addrChars.length !== chars.length) continue;
    if ([...addrChars].sort().join('') === inputSorted) {
      results.add(addr);
    }
  }

  // 2. 순열 중 주소 패턴에 맞는 것 찾기 (3글자 이하만 순열)
  if (chars.length <= 3) {
    const perms = getPermutations(chars);
    for (const perm of perms) {
      const word = perm.join('');
      if (word === input) continue;
      if (results.has(word)) continue;
      if (isPossibleAddress(word) && !KOREAN_PLACES.includes(word)) {
        results.add(word);
      }
    }
  }

  return [...results];
}

/**
 * 자모 재조합으로 주소/위치 찾기
 */
export function findJamoAddressAnagrams(input) {
  const chars = [...input.replace(/\s/g, '')];
  if (!chars.every(isHangul)) return [];

  const inputJamoKey = decomposeString(input.replace(/\s/g, '')).sort().join('');

  const results = [];
  for (const addr of KOREAN_ADDRESSES) {
    if (addr === input) continue;
    const addrJamoKey = decomposeString(addr).sort().join('');
    if (addrJamoKey === inputJamoKey) {
      results.push(addr);
    }
  }

  return results;
}

export { CHO, JUNG, JONG, KOREAN_SURNAMES, KOREAN_PLACES, KOREAN_ADDRESSES, KOREAN_NAME_SYLLABLES };
