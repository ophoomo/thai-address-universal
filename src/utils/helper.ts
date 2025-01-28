import { ILanguage } from '../types/database';

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
    if (
        typeof window !== 'undefined' &&
        typeof window.document !== 'undefined'
    ) {
        return window.localStorage.getItem('THAI_ADDRESS_UNIVERSAL') === 'eng'
            ? 'eng'
            : 'thai';
    }

    if (
        typeof process !== 'undefined' &&
        process.versions != null &&
        process.versions.node != null
    ) {
        return process.env.THAI_ADDRESS_UNIVERSAL === 'eng' ? 'eng' : 'thai';
    }

    return 'thai';
};
