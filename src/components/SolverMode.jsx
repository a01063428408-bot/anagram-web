import { useState } from 'react';
import { findAnagrams, findSubsetAnagrams, findCompoundSplits } from '../utils/anagram';
import { findPossibleNames, findPossiblePlaces, findJamoNameAnagrams, findJamoPlaceAnagrams, findPossibleAddresses, findJamoAddressAnagrams } from '../utils/korean';
import KoreanOptions from './KoreanOptions';

export default function SolverMode({ language, dictionary }) {
  const [input, setInput] = useState('');
  const [dictResults, setDictResults] = useState(null);
  const [neologismResults, setNeologismResults] = useState(null);
  const [placeResults, setPlaceResults] = useState(null);
  const [nameResults, setNameResults] = useState(null);
  const [addressResults, setAddressResults] = useState(null);
  const [subsetResults, setSubsetResults] = useState(null);
  const [compoundResults, setCompoundResults] = useState(null);
  const [koreanMode, setKoreanMode] = useState('jamo');
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = () => {
    if (!input.trim() || !dictionary) return;

    setSearching(true);

    setTimeout(() => {
      const mode = language === 'ko' ? koreanMode : 'char';
      const index = mode === 'jamo' ? dictionary.jamoIndex : dictionary.charIndex;
      const found = findAnagrams(input.trim(), index, mode);
      setDictResults(found);

      let neoFound = [];
      let filteredPlaces = [];
      let filteredAddresses = [];
      let filteredNames = [];

      // 한국어일 때 신조어/이름/고유명사 추정
      if (language === 'ko') {
        const foundSet = new Set(found.map(w => w.toLowerCase()));

        // 신조어 검색
        const neoIndex = mode === 'jamo' ? dictionary.neologismJamoIndex : dictionary.neologismCharIndex;
        if (neoIndex) {
          neoFound = findAnagrams(input.trim(), neoIndex, mode);
          neoFound = neoFound.filter(w => !foundSet.has(w.toLowerCase()));
        }
        setNeologismResults(neoFound.length > 0 ? neoFound : null);

        const neoSet = new Set(neoFound.map(w => w.toLowerCase()));

        // 장소/국가 검색
        const places = mode === 'jamo'
          ? findJamoPlaceAnagrams(input.trim())
          : findPossiblePlaces(input.trim());
        filteredPlaces = places.filter(p => !foundSet.has(p.toLowerCase()) && !neoSet.has(p.toLowerCase()));
        setPlaceResults(filteredPlaces.length > 0 ? filteredPlaces : null);

        const placeSet = new Set(filteredPlaces.map(p => p.toLowerCase()));

        // 주소/위치 검색
        const addresses = mode === 'jamo'
          ? findJamoAddressAnagrams(input.trim())
          : findPossibleAddresses(input.trim());
        filteredAddresses = addresses.filter(a => !foundSet.has(a.toLowerCase()) && !placeSet.has(a.toLowerCase()) && !neoSet.has(a.toLowerCase()));
        setAddressResults(filteredAddresses.length > 0 ? filteredAddresses : null);

        const addressSet = new Set(filteredAddresses.map(a => a.toLowerCase()));

        // 이름 검색 (givenNameSet 전달로 정확도 향상)
        const gns = dictionary.givenNameSet;
        const names = mode === 'jamo'
          ? findJamoNameAnagrams(input.trim(), gns)
          : findPossibleNames(input.trim(), gns);
        filteredNames = names.filter(n => !foundSet.has(n.toLowerCase()) && !placeSet.has(n.toLowerCase()) && !addressSet.has(n.toLowerCase()) && !neoSet.has(n.toLowerCase()));
        setNameResults(filteredNames.length > 0 ? filteredNames : null);
      } else {
        setNeologismResults(null);
        setPlaceResults(null);
        setAddressResults(null);
        setNameResults(null);
      }

      // 주요 결과가 없을 때 fallback: 부분 애너그램 + 복합어 분해
      const mainCount = found.length + neoFound.length + filteredPlaces.length + filteredAddresses.length + filteredNames.length;
      if (mainCount === 0) {
        const subsets = findSubsetAnagrams(input.trim(), index, mode);
        setSubsetResults(subsets.length > 0 ? subsets : null);

        const compounds = findCompoundSplits(input.trim(), index, mode);
        setCompoundResults(compounds.length > 0 ? compounds : null);
      } else {
        setSubsetResults(null);
        setCompoundResults(null);
      }

      setSearched(true);
      setSearching(false);
    }, 10);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const mainCount = (dictResults?.length || 0) + (neologismResults?.length || 0) + (placeResults?.length || 0) + (addressResults?.length || 0) + (nameResults?.length || 0);
  const fallbackCount = (subsetResults?.length || 0) + (compoundResults?.length || 0);
  const totalCount = mainCount + fallbackCount;
  const hasAnyResults = totalCount > 0;

  return (
    <div className="solver-mode">
      <div className="solver-input-group">
        <input
          type="text"
          className="solver-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          placeholder={{ ko: '단어를 입력하세요...', en: 'Enter a word...', ja: '単語を入力...', zh: '输入一个词...', es: 'Escribe una palabra...', fr: 'Entrez un mot...', de: 'Wort eingeben...' }[language] || 'Enter a word...'}
        />
        <button className="solver-btn" onClick={handleSearch} disabled={!input.trim()}>
          해석하기
        </button>
      </div>

      {language === 'ko' && (
        <KoreanOptions koreanMode={koreanMode} onChange={setKoreanMode} />
      )}

      {searching && <div className="result-loading">검색 중...</div>}

      {!searching && searched && !hasAnyResults && (
        <div className="result-empty">
          <p>애너그램을 찾을 수 없습니다.</p>
          <p className="result-empty-hint">다른 단어를 입력해 보세요.</p>
        </div>
      )}

      {!searching && hasAnyResults && (
        <div className="result-list">
          <h3 className="result-title">
            {mainCount > 0
              ? `총 ${mainCount}개의 애너그램을 찾았습니다!`
              : `정확한 애너그램은 없지만, ${fallbackCount}개의 관련 결과를 찾았습니다.`
            }
          </h3>

          {dictResults && dictResults.length > 0 && (
            <div className="result-section">
              <div className="result-section-title dict">
                사전 단어 ({dictResults.length}개)
              </div>
              <div className="result-grid">
                {dictResults.map((word, i) => (
                  <div key={i} className="result-card">{word}</div>
                ))}
              </div>
            </div>
          )}

          {neologismResults && neologismResults.length > 0 && (
            <div className="result-section">
              <div className="result-section-title neologism">
                신조어/줄임말 ({neologismResults.length}개)
              </div>
              <div className="result-grid">
                {neologismResults.map((word, i) => (
                  <div key={i} className="result-card neologism-card">{word}</div>
                ))}
              </div>
            </div>
          )}

          {placeResults && placeResults.length > 0 && (
            <div className="result-section">
              <div className="result-section-title place">
                고유명사 - 장소/국가 ({placeResults.length}개)
              </div>
              <div className="result-grid">
                {placeResults.map((word, i) => (
                  <div key={i} className="result-card place-card">{word}</div>
                ))}
              </div>
            </div>
          )}

          {addressResults && addressResults.length > 0 && (
            <div className="result-section">
              <div className="result-section-title address">
                주소/위치 ({addressResults.length}개)
              </div>
              <div className="result-grid">
                {addressResults.map((word, i) => (
                  <div key={i} className="result-card address-card">{word}</div>
                ))}
              </div>
            </div>
          )}

          {nameResults && nameResults.length > 0 && (
            <div className="result-section">
              <div className="result-section-title name">
                이름 추정 ({nameResults.length}개)
              </div>
              <div className="result-grid">
                {nameResults.map((word, i) => (
                  <div key={i} className="result-card name-card">{word}</div>
                ))}
              </div>
            </div>
          )}

          {compoundResults && compoundResults.length > 0 && (
            <div className="result-section">
              <div className="result-section-title compound">
                복합어 분해 ({compoundResults.length}개)
              </div>
              <div className="result-grid">
                {compoundResults.map((words, i) => (
                  <div key={i} className="result-card compound-card">
                    {words.join(' + ')}
                  </div>
                ))}
              </div>
            </div>
          )}

          {subsetResults && subsetResults.length > 0 && (
            <div className="result-section">
              <div className="result-section-title subset">
                부분 애너그램 - 일부 글자 사용 ({subsetResults.length}개)
              </div>
              <div className="result-grid">
                {subsetResults.map((word, i) => (
                  <div key={i} className="result-card subset-card">{word}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
