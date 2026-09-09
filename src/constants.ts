/**
 * Single source of truth for every value the library would otherwise embed as
 * a bare literal: language identifiers, geocode dimensions, postal-code shape,
 * the words that introduce an address component in written Thai, and the
 * canonical form of Bangkok.
 *
 * Parsing, formatting and dataset code all read from here, so behaviour can be
 * adjusted (or audited) in one place instead of hunting for magic numbers.
 */

/** Dataset languages the library can load. */
export const LANGUAGE = {
    THAI: 'thai',
    ENGLISH: 'eng',
} as const;

export type Language = (typeof LANGUAGE)[keyof typeof LANGUAGE];

/**
 * Name of the runtime override that selects the dataset language:
 * a `localStorage` key in the browser, an environment variable in Node.
 */
export const LANGUAGE_OVERRIDE_KEY = 'THAI_ADDRESS_UNIVERSAL';

/**
 * Digit lengths of the Thai standard geocode (รหัสมาตรฐานภูมิศาสตร์). Each
 * level is a strict prefix of the next: a 6-digit sub-district code starts
 * with its 4-digit district code, which starts with its 2-digit province code.
 */
export const GEOCODE_LENGTH = {
    PROVINCE: 2,
    DISTRICT: 4,
    SUB_DISTRICT: 6,
} as const;

/** A Thai postal code is always exactly this many digits. */
export const POSTAL_CODE_LENGTH = 5;

/** Result cap applied by `searchAddressBy*` when the caller does not pass one. */
export const DEFAULT_SEARCH_LIMIT = 20;

/**
 * The three named components of an address, ordered the way `splitAddress`
 * evaluates them. Used both to score candidate rows and to strip the matched
 * pieces out of the free-text remainder.
 */
export const ADDRESS_COMPONENT_FIELDS = [
    'district',
    'sub_district',
    'province',
] as const;

export type AddressComponentField = (typeof ADDRESS_COMPONENT_FIELDS)[number];

/** Fields a `searchAddressBy*` call is allowed to target. */
export const SEARCHABLE_FIELDS = [
    'province',
    'district',
    'sub_district',
    'postal_code',
] as const;

export type SearchableField = (typeof SEARCHABLE_FIELDS)[number];

/**
 * Words — and their conventional abbreviations — that prefix an address
 * component in written Thai. Removed before matching so that "ตำบลลุมพินี",
 * "ต.ลุมพินี" and "ลุมพินี" all compare as equal.
 */
export const ADDRESS_COMPONENT_PREFIXES = [
    'ตำบล',
    'อำเภอ',
    'จังหวัด',
    'แขวง',
    'เขต',
    'ต.',
    'อ.',
    'จ.',
    'แขวง.',
    'เขต.',
] as const;

/** Fully spelled, canonical name of Bangkok, in each language. */
export const BANGKOK_CANONICAL_NAME = 'กรุงเทพมหานคร';
export const BANGKOK_ENGLISH_NAME = 'Bangkok';

/**
 * The word that introduces each address component when a formatted address is
 * written out, per language. Bangkok uses แขวง / เขต (Khwaeng / Khet) instead
 * of ตำบล / อำเภอ, and drops the province prefix entirely.
 */
export const COMPONENT_PREFIX = {
    thai: { subDistrict: 'ตำบล', district: 'อำเภอ', province: 'จังหวัด' },
    thaiBangkok: { subDistrict: 'แขวง', district: 'เขต', province: '' },
    eng: { subDistrict: 'Tambon', district: 'Amphoe', province: 'Changwat' },
    engBangkok: { subDistrict: 'Khwaeng', district: 'Khet', province: '' },
} as const;

/**
 * Every shorthand people write in place of {@link BANGKOK_CANONICAL_NAME}.
 * Ordered longest-first (the canonical name itself is included) so a whole
 * match always beats a prefix match — otherwise "กรุงเทพมหานคร" would be
 * expanded again into "กรุงเทพมหานครมหานคร".
 */
export const BANGKOK_ALIASES = [
    BANGKOK_CANONICAL_NAME,
    'กรุงเทพฯ',
    'กรุงเทพ',
    'กทม.',
    'กทม',
] as const;

/** Tokens with no geographic meaning that are dropped from the remainder. */
export const NOISE_TOKENS = ['Thailand'] as const;

/**
 * Code point of "ก", the first Thai consonant. Character indexes in the
 * compressed dataset are stored relative to this value.
 */
export const THAI_FIRST_CONSONANT_CODE_POINT = 0x0e01;

/** Code point of "A": Latin indexes in the compressed dataset are relative to it. */
export const LATIN_CAPITAL_A_CODE_POINT = 65;

/** Code point of "a": lower-case Latin indexes continue after the 26 capitals. */
export const LATIN_SMALL_A_CODE_POINT = 97;

/** Number of letters in the Latin alphabet. */
export const LATIN_ALPHABET_SIZE = 26;

/** Matches a single Thai consonant (ก–ฮ). */
export const THAI_CONSONANT_PATTERN = /[ก-ฮ]/g;

/** Matches a single Latin letter. */
export const LATIN_LETTER_PATTERN = /[a-zA-Z]/g;

/**
 * Extracts the postal code from a free-text address: {@link POSTAL_CODE_LENGTH}
 * digits framed by whitespace or the end of the string.
 */
export const POSTAL_CODE_PATTERN = new RegExp(
    `\\s(\\d{${POSTAL_CODE_LENGTH}})(\\s|$)`,
    'i',
);

/** Escapes a literal string for safe interpolation into a `RegExp`. */
export const escapeRegExp = (value: string): string =>
    value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Matches any {@link ADDRESS_COMPONENT_PREFIXES} entry (e.g. "ต.", "ตำบล"). */
export const ADDRESS_COMPONENT_PREFIX_PATTERN = new RegExp(
    ADDRESS_COMPONENT_PREFIXES.map(escapeRegExp).join('|'),
    'g',
);

/**
 * Matches any {@link BANGKOK_ALIASES} entry. Longest-first so "กรุงเทพมหานคร"
 * matches whole and is replaced by itself rather than re-expanded.
 */
export const BANGKOK_ALIAS_PATTERN = new RegExp(
    `(${BANGKOK_ALIASES.map(escapeRegExp).join('|')})`,
    'gi',
);

/** Matches any {@link NOISE_TOKENS} entry. */
export const NOISE_TOKEN_PATTERN = new RegExp(
    NOISE_TOKENS.map(escapeRegExp).join('|'),
    'g',
);
