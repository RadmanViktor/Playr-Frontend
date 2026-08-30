import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import commonEn from './locales/en/common.json'
import layoutEn from './locales/en/layout.json'
import settingsEn from './locales/en/settings.json'
import pagesAEn from './locales/en/pagesA.json'
import pagesBEn from './locales/en/pagesB.json'
import componentsAEn from './locales/en/componentsA.json'
import componentsBEn from './locales/en/componentsB.json'
import uiEn from './locales/en/ui.json'

import commonSv from './locales/sv/common.json'
import layoutSv from './locales/sv/layout.json'
import settingsSv from './locales/sv/settings.json'
import pagesASv from './locales/sv/pagesA.json'
import pagesBSv from './locales/sv/pagesB.json'
import componentsASv from './locales/sv/componentsA.json'
import componentsBSv from './locales/sv/componentsB.json'
import uiSv from './locales/sv/ui.json'

export const defaultNS = 'common'

export const resources = {
  en: {
    common: commonEn,
    layout: layoutEn,
    settings: settingsEn,
    pagesA: pagesAEn,
    pagesB: pagesBEn,
    componentsA: componentsAEn,
    componentsB: componentsBEn,
    ui: uiEn,
  },
  sv: {
    common: commonSv,
    layout: layoutSv,
    settings: settingsSv,
    pagesA: pagesASv,
    pagesB: pagesBSv,
    componentsA: componentsASv,
    componentsB: componentsBSv,
    ui: uiSv,
  },
} as const

export const supportedLanguages = [
  { code: 'en', label: 'English' },
  { code: 'sv', label: 'Svenska' },
] as const

export const languageStorageKey = 'playr-language'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS,
    ns: Object.keys(resources.en),
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: languageStorageKey,
      caches: ['localStorage'],
    },
  })

export default i18n
