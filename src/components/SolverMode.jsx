import { useState, useEffect, useRef } from 'react';
import { findAnagrams, findSubsetAnagrams, findCompoundSplits } from '../utils/anagram';
import { findPossibleNames, findPossiblePlaces, findJamoNameAnagrams, findJamoPlaceAnagrams, findPossibleAddresses, findJamoAddressAnagrams } from '../utils/korean';
import KoreanOptions from './KoreanOptions';

const HISTORY_KEY = 'anagram-history';
const MAX_HISTORY = 15;

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  } catch { return []; }
}

function saveHistory(list) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, MAX_HISTORY)));
}

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
  const [toast, setToast] = useState(null);
  const [history, setHistory] = useState(loadHistory);
  const [showHistory, setShowHistory] = useState(false);
  const inputRef = useRef(null);
  const historyRef = useRef(null);

  const handleSearch = (searchValue) => {
    const value = (searchValue || input).trim();
    if (!value || !dictionary) return;

    // 검색 기록 저장
    const newHistory = [{ query: value, mode: koreanMode, timestamp: Date.now() }, ...history.filter(h => h.query !== value)].slice(0, MAX_HISTORY);
    setHistory(newHistory);
    saveHistory(newHistory);
    setShowHistory(false);

    setSearching(true);

    setTimeout(() => {
      const mode = language === 'ko' ? koreanMode : 'char';
      const index = mode === 'jamo' ? dictionary.jamoIndex : dictionary.charIndex;
      const found = findAnagrams(value, index, mode);
      setDictResults(found);

      let neoFound = [];
      let filteredPlaces = [];
      let filteredAddresses = [];
      let filteredNames = [];

      if (language === 'ko') {
        const foundSet = new Set(found.map(w => w.toLowerCase()));

        const neoIndex = mode === 'jamo' ? dictionary.neologismJamoIndex : dictionary.neologismCharIndex;
        if (neoIndex) {
          neoFound = findAnagrams(value, neoIndex, mode);
          neoFound = neoFound.filter(w => !foundSet.has(w.toLowerCase()));
        }
        setNeologismResults(neoFound.length > 0 ? neoFound : null);

        const neoSet = new Set(neoFound.map(w => w.toLowerCase()));

        const places = mode === 'jamo'
          ? findJamoPlaceAnagrams(value)
          : findPossiblePlaces(value);
        filteredPlaces = places.filter(p => !foundSet.has(p.toLowerCase()) && !neoSet.has(p.toLowerCase()));
        setPlaceResults(filteredPlaces.length > 0 ? filteredPlaces : null);

        const placeSet = new Set(filteredPlaces.map(p => p.toLowerCase()));

        const addresses = mode === 'jamo'
          ? findJamoAddressAnagrams(value)
          : findPossibleAddresses(value);
        filteredAddresses = addresses.filter(a => !foundSet.has(a.toLowerCase()) && !placeSet.has(a.toLowerCase()) && !neoSet.has(a.toLowerCase()));
        setAddressResults(filteredAddresses.length > 0 ? filteredAddresses : null);

        const addressSet = new Set(filteredAddresses.map(a => a.toLowerCase()));

        const gns = dictionary.givenNameSet;
        const names = mode === 'jamo'
          ? findJamoNameAnagrams(value, gns)
          : findPossibleNames(value, gns);
        filteredNames = names.filter(n => !foundSet.has(n.toLowerCase()) && !placeSet.has(n.toLowerCase()) && !addressSet.has(n.toLowerCase()) && !neoSet.has(n.toLowerCase()));
        setNameResults(filteredNames.length > 0 ? filteredNames : null);
      } else {
        setNeologismResults(null);
        setPlaceResults(null);
        setAddressResults(null);
        setNameResults(null);
      }

      const mainCount = found.length + neoFound.length + filteredPlaces.length + filteredAddresses.length + filteredNames.length;
      if (mainCount === 0) {
        const subsets = findSubsetAnagrams(value, index, mode);
        setSubsetResults(subsets.length > 0 ? subsets : null);

        const compounds = findCompoundSplits(value, index, mode);
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
    } else if (e.key === 'Escape') {
      setShowHistory(false);
    }
  };

  // 전역 키보드 단축키: Ctrl+Enter → 검색, Escape → 입력창 포커스
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSearch();
      } else if (e.key === 'Escape' && document.activeElement !== inputRef.current) {
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  // 히스토리 외부 클릭 닫기
  useEffect(() => {
    const handler = (e) => {
      if (historyRef.current && !historyRef.current.contains(e.target)) {
        setShowHistory(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // 복사
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1500);
  };

  const copyText = (text) => {
    navigator.clipboard.writeText(text).then(() => showToast('복사됨!'));
  };

  const copyAllResults = () => {
    const parts = [];
    if (dictResults?.length) parts.push(`[사전 단어] ${dictResults.join(', ')}`);
    if (neologismResults?.length) parts.push(`[신조어] ${neologismResults.join(', ')}`);
    if (placeResults?.length) parts.push(`[장소/국가] ${placeResults.join(', ')}`);
    if (addressResults?.length) parts.push(`[주소/위치] ${addressResults.join(', ')}`);
    if (nameResults?.length) parts.push(`[이름 추정] ${nameResults.join(', ')}`);
    if (compoundResults?.length) parts.push(`[복합어] ${compoundResults.map(w => w.join('+')).join(', ')}`);
    if (subsetResults?.length) parts.push(`[부분 애너그램] ${subsetResults.join(', ')}`);
    if (parts.length) copyText(`"${input}" 애너그램 결과:\n${parts.join('\n')}`);
  };

  const shareResults = async () => {
    const parts = [];
    if (dictResults?.length) parts.push(dictResults.join(', '));
    if (neologismResults?.length) parts.push(neologismResults.join(', '));
    if (placeResults?.length) parts.push(placeResults.join(', '));
    if (nameResults?.length) parts.push(nameResults.join(', '));
    try {
      await navigator.share({
        title: `"${input}" 애너그램 결과 - Anagram Lab`,
        text: `"${input}"의 애너그램: ${parts.join(', ')}`,
        url: 'https://anagram-web.vercel.app',
      });
    } catch {}
  };

  const clearHistory = () => {
    setHistory([]);
    saveHistory([]);
    setShowHistory(false);
  };

  const selectHistory = (query) => {
    setInput(query);
    setShowHistory(false);
    setTimeout(() => handleSearch(query), 0);
  };

  const mainCount = (dictResults?.length || 0) + (neologismResults?.length || 0) + (placeResults?.length || 0) + (addressResults?.length || 0) + (nameResults?.length || 0);
  const fallbackCount = (subsetResults?.length || 0) + (compoundResults?.length || 0);
  const totalCount = mainCount + fallbackCount;
  const hasAnyResults = totalCount > 0;
  const canShare = typeof navigator.share === 'function';

  return (
    <div className="solver-mode">
      <div className="solver-input-group" ref={historyRef}>
        <div className="input-wrapper">
          <input
            ref={inputRef}
            type="text"
            className="solver-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => history.length > 0 && setShowHistory(true)}
            autoFocus
            placeholder={{ ko: '단어를 입력하세요... (Ctrl+Enter)', en: 'Enter a word... (Ctrl+Enter)', ja: '単語を入力... (Ctrl+Enter)', zh: '输入一个词... (Ctrl+Enter)', es: 'Escribe una palabra...', fr: 'Entrez un mot...', de: 'Wort eingeben...' }[language] || 'Enter a word...'}
          />
          {showHistory && history.length > 0 && (
            <div className="search-history">
              <div className="history-header">
                <span className="history-label">최근 검색</span>
                <button className="history-clear-btn" onClick={clearHistory}>전체 삭제</button>
              </div>
              {history.map((h, i) => (
                <button key={i} className="history-item" onClick={() => selectHistory(h.query)}>
                  <span className="history-query">{h.query}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <button className="solver-btn" onClick={() => handleSearch()} disabled={!input.trim()}>
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
          <div className="result-header">
            <h3 className="result-title">
              {mainCount > 0
                ? `총 ${mainCount}개의 애너그램을 찾았습니다!`
                : `정확한 애너그램은 없지만, ${fallbackCount}개의 관련 결과를 찾았습니다.`
              }
            </h3>
            <div className="result-actions">
              <button className="action-btn" onClick={copyAllResults} title="전체 결과 복사">
                복사
              </button>
              {canShare && (
                <button className="action-btn" onClick={shareResults} title="결과 공유">
                  공유
                </button>
              )}
            </div>
          </div>

          {dictResults && dictResults.length > 0 && (
            <div className="result-section">
              <div className="result-section-title dict">
                사전 단어 ({dictResults.length}개)
              </div>
              <div className="result-grid">
                {dictResults.map((word, i) => (
                  <div key={i} className="result-card" onClick={() => copyText(word)} title="클릭하여 복사">{word}</div>
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
                  <div key={i} className="result-card neologism-card" onClick={() => copyText(word)} title="클릭하여 복사">{word}</div>
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
                  <div key={i} className="result-card place-card" onClick={() => copyText(word)} title="클릭하여 복사">{word}</div>
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
                  <div key={i} className="result-card address-card" onClick={() => copyText(word)} title="클릭하여 복사">{word}</div>
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
                  <div key={i} className="result-card name-card" onClick={() => copyText(word)} title="클릭하여 복사">{word}</div>
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
                  <div key={i} className="result-card compound-card" onClick={() => copyText(words.join(' + '))} title="클릭하여 복사">
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
                  <div key={i} className="result-card subset-card" onClick={() => copyText(word)} title="클릭하여 복사">{word}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {toast && <div className="toast-message">{toast}</div>}
    </div>
  );
}
