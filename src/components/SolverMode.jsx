import { useState } from 'react';
import { findAnagrams } from '../utils/anagram';
import { findPossibleNames, findPossiblePlaces, findJamoNameAnagrams, findJamoPlaceAnagrams } from '../utils/korean';
import KoreanOptions from './KoreanOptions';

export default function SolverMode({ language, dictionary }) {
  const [input, setInput] = useState('');
  const [dictResults, setDictResults] = useState(null);
  const [placeResults, setPlaceResults] = useState(null);
  const [nameResults, setNameResults] = useState(null);
  const [koreanMode, setKoreanMode] = useState('char');
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

      // 한국어일 때 이름/고유명사 추정
      if (language === 'ko') {
        const foundSet = new Set(found.map(w => w.toLowerCase()));

        // 자모 모드: 자모 재조합으로 검색, 글자 모드: 글자 순열로 검색
        const places = mode === 'jamo'
          ? findJamoPlaceAnagrams(input.trim())
          : findPossiblePlaces(input.trim());
        const filteredPlaces = places.filter(p => !foundSet.has(p.toLowerCase()));
        setPlaceResults(filteredPlaces.length > 0 ? filteredPlaces : null);

        const placeSet = new Set(filteredPlaces.map(p => p.toLowerCase()));
        const names = mode === 'jamo'
          ? findJamoNameAnagrams(input.trim())
          : findPossibleNames(input.trim());
        const filteredNames = names.filter(n => !foundSet.has(n.toLowerCase()) && !placeSet.has(n.toLowerCase()));
        setNameResults(filteredNames.length > 0 ? filteredNames : null);
      } else {
        setPlaceResults(null);
        setNameResults(null);
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

  const totalCount = (dictResults?.length || 0) + (placeResults?.length || 0) + (nameResults?.length || 0);
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
            총 {totalCount}개의 애너그램을 찾았습니다!
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
        </div>
      )}
    </div>
  );
}
