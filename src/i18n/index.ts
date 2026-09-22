import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enCommon from './locales/en/common.json';
import thCommon from './locales/th/common.json';

/** th is the default language; one namespace per module (common, enquiry, staff, …). */
void i18n.use(initReactI18next).init({
  resources: {
    th: { common: thCommon },
    en: { common: enCommon },
  },
  lng: 'th',
  fallbackLng: 'th',
  defaultNS: 'common',
  interpolation: { escapeValue: false },
});

export default i18n;
