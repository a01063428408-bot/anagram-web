import LanguageSelector from './LanguageSelector';
import ModeSelector from './ModeSelector';

export default function Header({ language, onLanguageChange, mode, onModeChange }) {
  return (
    <header className="header">
      <div className="header-top">
        <h1 className="logo">Anagram Lab</h1>
        <LanguageSelector language={language} onChange={onLanguageChange} />
      </div>
      <ModeSelector mode={mode} onChange={onModeChange} />
    </header>
  );
}
