import { useState, useEffect } from 'react';
import { loadDictionary } from '../utils/dictionary';

/**
 * 사전 데이터 로딩 커스텀 훅
 * @param {string} language - 'en' 또는 'ko'
 */
export function useDictionary(language) {
  const [dictionary, setDictionary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const data = await loadDictionary(language);
        if (!cancelled) {
          setDictionary(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [language]);

  return { dictionary, loading, error };
}
