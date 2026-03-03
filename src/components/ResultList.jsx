export default function ResultList({ results, loading }) {
  if (loading) {
    return <div className="result-loading">검색 중...</div>;
  }

  if (!results) {
    return null;
  }

  if (results.length === 0) {
    return (
      <div className="result-empty">
        <p>애너그램을 찾을 수 없습니다.</p>
        <p className="result-empty-hint">다른 단어를 입력해 보세요.</p>
      </div>
    );
  }

  return (
    <div className="result-list">
      <h3 className="result-title">
        {results.length}개의 애너그램을 찾았습니다!
      </h3>
      <div className="result-grid">
        {results.map((word, index) => (
          <div key={index} className="result-card">
            {word}
          </div>
        ))}
      </div>
    </div>
  );
}
