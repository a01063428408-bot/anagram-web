import { useState, useRef, useEffect } from 'react';

const MAIN_LANGUAGES = [
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
];

const OTHER_LANGUAGES = [
  { code: 'ja', label: '日本語 (일본어)', flag: '🇯🇵' },
  { code: 'zh', label: '中文 (중국어)', flag: '🇨🇳' },
  { code: 'es', label: 'Español (스페인어)', flag: '🇪🇸' },
  { code: 'fr', label: 'Français (프랑스어)', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch (독일어)', flag: '🇩🇪' },
];

const ALL_LANGUAGES = [...MAIN_LANGUAGES, ...OTHER_LANGUAGES];

export default function LanguageSelector({ language, onChange }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isOtherLang = OTHER_LANGUAGES.some(l => l.code === language);
  const currentOther = OTHER_LANGUAGES.find(l => l.code === language);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOtherSelect = (code) => {
    onChange(code);
    setDropdownOpen(false);
  };

  return (
    <div className="language-selector">
      {MAIN_LANGUAGES.map(lang => (
        <button
          key={lang.code}
          className={`lang-btn ${language === lang.code ? 'active' : ''}`}
          onClick={() => { onChange(lang.code); setDropdownOpen(false); }}
        >
          <span className="flag">{lang.flag}</span>
          <span className="lang-label">{lang.label}</span>
        </button>
      ))}

      <div className="lang-dropdown-wrap" ref={dropdownRef}>
        <button
          className={`lang-btn other-btn ${isOtherLang ? 'active' : ''}`}
          onClick={() => setDropdownOpen(prev => !prev)}
        >
          <span className="flag">{isOtherLang ? currentOther.flag : '🌐'}</span>
          <span className="lang-label">
            {isOtherLang ? currentOther.label : '그 외 언어'}
          </span>
          <span className="dropdown-arrow">{dropdownOpen ? '▲' : '▼'}</span>
        </button>

        {dropdownOpen && (
          <div className="lang-dropdown">
            {OTHER_LANGUAGES.map(lang => (
              <button
                key={lang.code}
                className={`lang-dropdown-item ${language === lang.code ? 'active' : ''}`}
                onClick={() => handleOtherSelect(lang.code)}
              >
                <span className="flag">{lang.flag}</span>
                <span>{lang.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
