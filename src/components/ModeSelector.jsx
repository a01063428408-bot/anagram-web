export default function ModeSelector({ mode, onChange }) {
  return (
    <div className="mode-selector">
      <button
        className={`mode-btn ${mode === 'maker' ? 'active' : ''}`}
        onClick={() => onChange('maker')}
      >
        ✏️ 제작 모드
      </button>
      <button
        className={`mode-btn ${mode === 'solver' ? 'active' : ''}`}
        onClick={() => onChange('solver')}
      >
        🔍 해석 모드
      </button>
    </div>
  );
}
