import { ILanguage } from '../types/database';

/**
 * Checks if code is running in a browser environment.
 * @returns true if running in browser, false otherwise
 */
const isBrowser = (): boolean =>
    typeof window !== 'undefined' && typeof window.document !== 'undefined';

/**
 * Gets the stored language preference from the environment.
 * @returns The stored language value ('eng' or null/undefined)
 */
const getStoredLanguage = (): string | null => {
    if (isBrowser()) {
        return localStorage.getItem('THAI_ADDRESS_UNIVERSAL');
    }
    if (typeof process !== 'undefined' && process.versions?.node != null) {
        return process.env.THAI_ADDRESS_UNIVERSAL ?? null;
    }
    return null;
};

/**
 * Ensures that the input is returned as a string.
 * If the input is a number, it is converted to a string.
 * If the input is a boolean, an empty string is returned.
 *
 * @param data - The input value, which can be either a number or a boolean.
 * @returns A string representing the input value, or an empty string if the input is a boolean.
 */
export const ensureGeo = (data: number | boolean): string => {
    return typeof data === 'number' ? data.toString() : '';
};

/**
 * Retrieves the default language setting.
 * - In a Node.js environment, it checks the `THAI_ADDRESS_UNIVERSAL` environment variable.
 * - In a web browser environment, it checks the `THAI_ADDRESS_UNIVERSAL` value in localStorage.
 * - Defaults to 'thai' if no valid setting is found.
 * @returns ILanguage - The default language ('thai' or 'eng').
 */
export const getDefaultLanguage = (): ILanguage => {
    return getStoredLanguage() === 'eng' ? 'eng' : 'thai';
};
