import { LANGUAGE, LANGUAGE_OVERRIDE_KEY, type Language } from '../constants';

/** True when running in a browser (a `window` with a `document` exists). */
const isBrowser = (): boolean =>
    typeof window !== 'undefined' && typeof window.document !== 'undefined';

/**
 * Reads the language override the host set, or `null` if none is present.
 *
 * - Browser: the `LANGUAGE_OVERRIDE_KEY` entry in `localStorage`.
 * - Node: the `LANGUAGE_OVERRIDE_KEY` environment variable.
 */
const getStoredLanguage = (): string | null => {
    if (isBrowser()) {
        return localStorage.getItem(LANGUAGE_OVERRIDE_KEY);
    }
    if (typeof process !== 'undefined' && process.versions?.node != null) {
        return process.env[LANGUAGE_OVERRIDE_KEY] ?? null;
    }
    return null;
};

/**
 * Normalises a raw geocode entry to a string: a number becomes its decimal
 * text, anything else (a boolean placeholder in the source data) becomes `''`.
 */
export const ensureGeo = (data: number | boolean): string =>
    typeof data === 'number' ? data.toString() : '';

/**
 * The dataset language to load at startup: whatever the host override says,
 * falling back to Thai.
 */
export const getDefaultLanguage = (): Language =>
    getStoredLanguage() === LANGUAGE.ENGLISH ? LANGUAGE.ENGLISH : LANGUAGE.THAI;
