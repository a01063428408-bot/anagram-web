import { useState } from 'react';
import Header from './components/Header';
import SolverMode from './components/SolverMode';
import MakerMode from './components/MakerMode';
import AdBanner from './components/AdBanner';
import { useDictionary } from './hooks/useDictionary';
import './App.css';

export default function App() {
  const [language, setLanguage] = useState('ko');
  const [mode, setMode] = useState('maker');
  const { dictionary, loading, error } = useDictionary(language);

  return (
    <div className="app">
      <Header
        language={language}
        onLanguageChange={setLanguage}
        mode={mode}
        onModeChange={setMode}
      />

      <main className="main-content">
        <AdBanner adClient="ca-pub-5351713887787298" />

        {loading && (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <p>사전 데이터를 불러오는 중...</p>
          </div>
        )}

        {error && (
          <div className="error-message">
            <p>사전을 불러올 수 없습니다: {error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            {mode === 'solver' ? (
              <SolverMode language={language} dictionary={dictionary} />
            ) : (
              <MakerMode language={language} dictionary={dictionary} />
            )}
          </>
        )}

        <AdBanner adClient="ca-pub-5351713887787298" />

        <div className="notice-box">
          <span className="notice-label">안내</span>
          <span>단어만 입력 가능 (문장 불가) · 한국어는 한글만 가능 · 사전 미등록 단어는 해석 불가 · 이름/고유명사 감지는 한국어만 지원</span>
        </div>
      </main>

      <footer className="footer">
        <p className="footer-copyright">Anagram Lab &copy; 2026</p>
      </footer>
    </div>
  );
}
