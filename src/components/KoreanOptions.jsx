export default function KoreanOptions({ koreanMode, onChange }) {
  return (
    <div className="korean-options">
      <span className="korean-options-label">한글 모드:</span>
      <button
        className={`korean-mode-btn ${koreanMode === 'jamo' ? 'active' : ''}`}
        onClick={() => onChange('jamo')}
      >
        자모 단위
      </button>
      <button
        className={`korean-mode-btn ${koreanMode === 'char' ? 'active' : ''}`}
        onClick={() => onChange('char')}
      >
        글자 단위
      </button>
    </div>
  );
}
