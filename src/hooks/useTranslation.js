import { useTranslation as useI18next } from 'react-i18next';

/**
 * Custom wrapper for useTranslation to provide 'language' directly
 * and maintain compatibility across the app.
 */
export const useTranslation = () => {
  const { t, i18n } = useI18next();
  
  return {
    t,
    i18n,
    language: i18n.language,
  };
};
