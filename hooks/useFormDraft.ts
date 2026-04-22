import { useState, useEffect } from 'react';

export function useFormDraft<T>(key: string, initialValue: T) {
  const [formData, setFormData] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error reading draft from localStorage', e);
    }
    return initialValue;
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(formData));
    } catch (e) {
      console.error('Error saving draft to localStorage', e);
    }
  }, [key, formData]);

  const clearDraft = (override?: Partial<T>) => {
    localStorage.removeItem(key);
    setFormData({ ...initialValue, ...override });
  };

  return [formData, setFormData, clearDraft] as const;
}
