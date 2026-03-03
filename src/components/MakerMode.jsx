import { useState, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import SortableCard from './SortableCard';
import KoreanOptions from './KoreanOptions';
import { decomposeStringWithRoles, recomposeFromJamo, splitByChar, jamoShuffle, isPossibleKoreanName, isPossiblePlace } from '../utils/korean';
import { shuffle, isValidWord } from '../utils/anagram';

export default function MakerMode({ language, dictionary }) {
  const [input, setInput] = useState('');
  const [koreanMode, setKoreanMode] = useState('char');
  const [cards, setCards] = useState([]);
  const [submitted, setSubmitted] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleSplit = () => {
    if (!input.trim()) return;
    const text = input.trim();
    let pieces;

    if (language === 'ko' && koreanMode === 'jamo') {
      const piecesWithRoles = decomposeStringWithRoles(text);
      setCards(piecesWithRoles.map((p, i) => ({ id: `card-${i}`, char: p.char, role: p.role })));
      setSubmitted(true);
      return;
    } else {
      pieces = splitByChar(text);
    }

    setCards(pieces.map((char, i) => ({ id: `card-${i}`, char })));
    setSubmitted(true);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSplit();
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setCards((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleShuffle = () => {
    if (language === 'ko' && koreanMode === 'jamo') {
      setCards((prev) => jamoShuffle(prev));
    } else {
      setCards((prev) => shuffle(prev));
    }
  };

  const handleReset = () => {
    setCards([]);
    setSubmitted(false);
    setInput('');
  };

  // 현재 카드 순서로 조합된 결과 문자열
  const resultString = useMemo(() => {
    const chars = cards.map((c) => c.char);
    if (language === 'ko' && koreanMode === 'jamo') {
      return recomposeFromJamo(chars);
    }
    return chars.join('');
  }, [cards, language, koreanMode]);

  // 사전에 있는 단어인지 확인
  const isValid = useMemo(() => {
    if (!dictionary || !resultString) return false;
    return isValidWord(resultString, dictionary.wordSet);
  }, [resultString, dictionary]);

  // 고유명사(장소/국가) 확인
  const isPlace = useMemo(() => {
    if (language !== 'ko' || !resultString || isValid) return false;
    return isPossiblePlace(resultString);
  }, [resultString, language, isValid]);

  // 한국 이름으로 추정되는지 확인
  const isName = useMemo(() => {
    if (language !== 'ko' || !resultString || isValid || isPlace) return false;
    return isPossibleKoreanName(resultString);
  }, [resultString, language, isValid, isPlace]);

  return (
    <div className="maker-mode">
      {!submitted ? (
        <div className="maker-input-group">
          <input
            type="text"
            className="maker-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={{ ko: '재배열할 단어를 입력하세요...', en: 'Enter a word to rearrange...', ja: '並べ替える単語を入力...', zh: '输入要重排的词...', es: 'Escribe una palabra...', fr: 'Entrez un mot...', de: 'Wort eingeben...' }[language] || 'Enter a word to rearrange...'}
          />
          <button className="maker-btn" onClick={handleSplit} disabled={!input.trim()}>
            분리하기
          </button>
          {language === 'ko' && (
            <KoreanOptions koreanMode={koreanMode} onChange={setKoreanMode} />
          )}
        </div>
      ) : (
        <div className="maker-workspace">
          <div className="maker-controls">
            <button className="control-btn shuffle-btn" onClick={handleShuffle}>
              🔀 셔플
            </button>
            <button className="control-btn reset-btn" onClick={handleReset}>
              ↩️ 초기화
            </button>
          </div>

          <p className="maker-hint">카드를 드래그해서 순서를 바꿔보세요!</p>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={cards} strategy={horizontalListSortingStrategy}>
              <div className="card-container">
                {cards.map((card) => (
                  <SortableCard key={card.id} id={card.id} char={card.char} />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <div className="maker-result">
            <span className="maker-result-label">결과:</span>
            <span className={`maker-result-word ${isValid ? 'valid' : ''}`}>
              {resultString}
            </span>
            {resultString && (
              <span className={`validity-badge ${isValid ? 'valid' : isPlace ? 'place' : isName ? 'name' : 'invalid'}`}>
                {isValid ? '✅ 사전에 있는 단어!' : isPlace ? '📍 고유명사 (장소/국가)' : isName ? '👤 이름으로 추정됨' : '❌ 사전에 없음'}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
