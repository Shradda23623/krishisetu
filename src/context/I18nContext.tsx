import React, { createContext, useContext, useState, useCallback } from "react";
import { Language, translations } from "@/i18n/translations";

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem("krishisetu-lang");
    return (saved as Language) || "en";
  });

  const setLanguage = useCallback((lang: Language) => {
    setLang(lang);
    localStorage.setItem("krishisetu-lang", lang);
  }, []);

  const t = useCallback((key: string): string => {
    const trans = translations[language];
    return (trans as Record<string, string>)[key] || key;
  }, [language]);

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
};
