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
      </main>

      <footer className="footer">
        <div className="footer-notice">
          <p className="notice-title">안내사항</p>
          <ul className="notice-list">
            <li>띄어쓰기 없는 <strong>단어만</strong> 입력 가능합니다 (문장/구 불가)</li>
            <li>한국어는 <strong>한글만</strong> 입력 가능합니다 (영어·숫자·특수문자 혼합 불가)</li>
            <li>사전에 없는 단어는 해석 결과에 나오지 않을 수 있습니다</li>
            <li>이름 추정 및 고유명사 감지는 <strong>한국어만</strong> 지원됩니다</li>
            <li>영어 외 언어(일본어, 중국어 등)는 사전 데이터가 제한적입니다</li>
          </ul>
        </div>
        <p className="footer-copyright">Anagram Lab &copy; 2026</p>
      </footer>
    </div>
  );
}
