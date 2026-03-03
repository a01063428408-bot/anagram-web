import { useState } from 'react';
import { findAnagrams } from '../utils/anagram';
import KoreanOptions from './KoreanOptions';
import ResultList from './ResultList';

export default function SolverMode({ language, dictionary }) {
  const [input, setInput] = useState('');
  const [results, setResults] = useState(null);
  const [koreanMode, setKoreanMode] = useState('char');
  const [searching, setSearching] = useState(false);

  const handleSearch = () => {
    if (!input.trim() || !dictionary) return;

    setSearching(true);

    // 비동기처럼 처리해서 UI 블로킹 방지
    setTimeout(() => {
      const mode = language === 'ko' ? koreanMode : 'char';
      const index = mode === 'jamo' ? dictionary.jamoIndex : dictionary.charIndex;
      const found = findAnagrams(input.trim(), index, mode);
      setResults(found);
      setSearching(false);
    }, 10);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

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

      <ResultList results={results} loading={searching} />
    </div>
  );
}
