import { useState, useEffect } from 'react';

export function usePreferences() {
  const [preferences, setPreferences] = useState({
    diet: 'none',
    personalized_recommendations: true
  });

  useEffect(() => {
    fetch('/api/preferences')
      .then(res => res.json())
      .then(data => {
        if (data) setPreferences({
          diet: data.diet,
          personalized_recommendations: !!data.personalized_recommendations
        });
      });
  }, []);

  const updatePreferences = async (newPrefs: typeof preferences) => {
    setPreferences(newPrefs);
    await fetch('/api/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPrefs)
    });
  };

  return { preferences, updatePreferences };
}
