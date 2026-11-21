import { LANGUAGE, type Language } from '../constants';

/** Any character of the Thai Unicode block. */
const THAI_CHARACTER = /[฀-๿]/;

/** Any Latin letter. */
const LATIN_LETTER = /[a-z]/i;

/**
 * Guesses which dataset language a set of place names is written in: English
 * when at least one of them has a Latin letter and none has a Thai character,
 * Thai otherwise (including when there is nothing to go on).
 *
 * Lets `formatAddress` and `validateAddress` accept a `splitAddress` result
 * from English mode as-is, without the caller repeating `language: 'eng'`.
 */
export const inferLanguage = (
    values: readonly (string | number | undefined)[],
): Language => {
    const text = values
        .filter((value) => value !== undefined)
        .map(String)
        .join(' ');
    return LATIN_LETTER.test(text) && !THAI_CHARACTER.test(text)
        ? LANGUAGE.ENGLISH
        : LANGUAGE.THAI;
};
