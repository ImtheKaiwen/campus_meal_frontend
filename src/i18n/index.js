import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

import tr from './tr.json';
import en from './en.json';

// Cihazın varsayılan dilini alıyoruz, bulamazsa 'tr' yapıyoruz
const deviceLanguage = getLocales()[0].languageCode;

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    resources: {
      tr: tr,
      en: en,
    },
    lng: deviceLanguage || 'tr', 
    fallbackLng: 'tr',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;