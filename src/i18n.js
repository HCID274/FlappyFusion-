export const SUPPORTED_LOCALES = ['zh', 'ja'];
export const DEFAULT_LOCALE = 'zh';

const HTML_LANG = {
  zh: 'zh-CN',
  ja: 'ja-JP',
};

let currentLocale = detectInitialLocale();
const listeners = new Set();

export function initLocale() {
  applyDocumentLocale();
  return currentLocale;
}

export function getLocale() {
  return currentLocale;
}

export function setLocale(locale) {
  const normalized = normalizeLocale(locale);
  if (!normalized) {
    throw new Error(`[i18n] Unsupported locale: ${locale}`);
  }

  if (currentLocale === normalized) return;
  currentLocale = normalized;

  if (typeof window !== 'undefined') {
    window.localStorage?.setItem('fusion-flappy-locale', currentLocale);
  }

  applyDocumentLocale();
  for (const listener of listeners) listener(currentLocale);
}

export function onLocaleChange(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function textFromCatalog(catalog, path, values = {}, locale = currentLocale) {
  const value = getFromCatalog(catalog, locale, path);
  if (typeof value !== 'string') {
    throw new Error(`[i18n] Expected string at "${path}" for locale "${locale}"`);
  }
  return interpolate(value, values);
}

export function valueFromCatalog(catalog, path, locale = currentLocale) {
  return getFromCatalog(catalog, locale, path);
}

export function validateCatalog(catalog, requiredLocales = SUPPORTED_LOCALES) {
  const errors = [];
  const referenceLocale = requiredLocales[0];
  const reference = catalog[referenceLocale];

  if (!isPlainObject(reference)) {
    errors.push(`Missing reference locale "${referenceLocale}"`);
  }

  for (const locale of requiredLocales) {
    if (!isPlainObject(catalog[locale])) {
      errors.push(`Missing locale "${locale}"`);
      continue;
    }
    compareShape(reference, catalog[locale], locale, [], errors);
  }

  const extraLocales = Object.keys(catalog).filter((locale) => !requiredLocales.includes(locale));
  for (const locale of extraLocales) {
    errors.push(`Unexpected locale "${locale}"`);
  }

  if (errors.length > 0) {
    throw new Error(`[i18n] Catalog validation failed:\n${errors.map((e) => `- ${e}`).join('\n')}`);
  }

  return true;
}

function detectInitialLocale() {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;

  const params = new URLSearchParams(window.location.search);
  return (
    normalizeLocale(params.get('lang')) ||
    normalizeLocale(window.localStorage?.getItem('fusion-flappy-locale')) ||
    normalizeLocale(window.navigator.language) ||
    DEFAULT_LOCALE
  );
}

function normalizeLocale(locale) {
  if (!locale) return null;
  const value = String(locale).toLowerCase();
  if (value.startsWith('zh')) return 'zh';
  if (value.startsWith('ja')) return 'ja';
  return SUPPORTED_LOCALES.includes(value) ? value : null;
}

function applyDocumentLocale() {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = HTML_LANG[currentLocale];
}

function getFromCatalog(catalog, locale, path) {
  if (!SUPPORTED_LOCALES.includes(locale)) {
    throw new Error(`[i18n] Unsupported locale: ${locale}`);
  }

  let node = catalog[locale];
  for (const part of path.split('.')) {
    if (!node || !Object.prototype.hasOwnProperty.call(node, part)) {
      throw new Error(`[i18n] Missing key "${path}" for locale "${locale}"`);
    }
    node = node[part];
  }
  return node;
}

function interpolate(template, values) {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    if (!Object.prototype.hasOwnProperty.call(values, key)) {
      throw new Error(`[i18n] Missing interpolation value "{${key}}"`);
    }
    return String(values[key]);
  });
}

function compareShape(reference, candidate, locale, path, errors) {
  const keyPath = path.length > 0 ? path.join('.') : '<root>';

  if (typeof reference === 'string') {
    if (typeof candidate !== 'string') {
      errors.push(`${locale}.${keyPath} must be a string`);
    } else if (candidate.trim() === '') {
      errors.push(`${locale}.${keyPath} must not be empty`);
    }
    return;
  }

  if (Array.isArray(reference)) {
    if (!Array.isArray(candidate)) {
      errors.push(`${locale}.${keyPath} must be an array`);
      return;
    }
    if (candidate.length !== reference.length) {
      errors.push(`${locale}.${keyPath} length ${candidate.length} does not match ${reference.length}`);
    }
    for (let i = 0; i < reference.length; i += 1) {
      compareShape(reference[i], candidate[i], locale, [...path, String(i)], errors);
    }
    return;
  }

  if (isPlainObject(reference)) {
    if (!isPlainObject(candidate)) {
      errors.push(`${locale}.${keyPath} must be an object`);
      return;
    }

    for (const key of Object.keys(reference)) {
      if (!Object.prototype.hasOwnProperty.call(candidate, key)) {
        errors.push(`${locale}.${[...path, key].join('.')} is missing`);
        continue;
      }
      compareShape(reference[key], candidate[key], locale, [...path, key], errors);
    }

    for (const key of Object.keys(candidate)) {
      if (!Object.prototype.hasOwnProperty.call(reference, key)) {
        errors.push(`${locale}.${[...path, key].join('.')} is unexpected`);
      }
    }
    return;
  }

  errors.push(`${keyPath} uses unsupported catalog value type`);
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
