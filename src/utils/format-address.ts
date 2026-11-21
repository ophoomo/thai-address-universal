import {
    BANGKOK_CANONICAL_NAME,
    BANGKOK_ENGLISH_NAME,
    COMPONENT_PREFIX,
    LANGUAGE,
    type Language,
} from '../constants';
import { inferLanguage } from './language';

/**
 * The pieces of an address that {@link formatAddress} assembles.
 *
 * Both spellings of the two-word fields are accepted — `subDistrict` /
 * `postalCode`, and `sub_district` / `postal_code` as `splitAddress` returns
 * them — so a parsed address can be formatted again directly. When both are
 * given, the camelCase one wins.
 */
export interface AddressParts {
    /** House number / street / village — printed first, verbatim. */
    address?: string;
    /** ตำบล / แขวง. */
    subDistrict?: string;
    /** Same as `subDistrict`, spelled the way `splitAddress` returns it. */
    sub_district?: string;
    /** อำเภอ / เขต. */
    district?: string;
    /** จังหวัด. */
    province?: string;
    /** 5-digit postal code — printed last. */
    postalCode?: string | number;
    /** Same as `postalCode`, spelled the way `splitAddress` returns it. */
    postal_code?: string | number;
}

/** Options for {@link formatAddress}. */
export interface FormatAddressOptions {
    /**
     * Language of the component-introducing words ("ตำบล" vs "Tambon").
     * When omitted it follows the names: English if they are written in Latin
     * letters only, Thai otherwise. Also decides the default of `prefix`.
     */
    language?: Language;
    /**
     * Prefix each component with its administrative word (ตำบล / อำเภอ / …,
     * or แขวง / เขต for Bangkok).
     *
     * Defaults to `true` in Thai and `false` in English: written Thai always
     * introduces each component, while English addresses conventionally list
     * the bare names ("Si Phum, Mueang Chiang Mai, Chiang Mai") — the Universal
     * Postal Union treats the administrative words as optional. Pass `true` to
     * get "Tambon / Amphoe / Changwat" (or "Khwaeng / Khet" for Bangkok).
     */
    prefix?: boolean;
    /** String placed between components. Defaults to a single space. */
    separator?: string;
}

const isBangkok = (province: string | undefined): boolean =>
    province === BANGKOK_CANONICAL_NAME || province === BANGKOK_ENGLISH_NAME;

const prefixSet = (language: Language, bangkok: boolean) => {
    if (language === LANGUAGE.ENGLISH) {
        return bangkok ? COMPONENT_PREFIX.engBangkok : COMPONENT_PREFIX.eng;
    }
    return bangkok ? COMPONENT_PREFIX.thaiBangkok : COMPONENT_PREFIX.thai;
};

/**
 * Assembles a single address string from its parts — the inverse of
 * `splitAddress`.
 *
 * Components that are absent or blank are skipped. With `prefix` on (the
 * default in Thai, off in English) each component is introduced by its
 * administrative word, switching to แขวง / เขต automatically when the province
 * is Bangkok.
 *
 * @example
 * formatAddress({
 *   address: '99/9',
 *   subDistrict: 'ศรีภูมิ',
 *   district: 'เมืองเชียงใหม่',
 *   province: 'เชียงใหม่',
 *   postalCode: '50200',
 * });
 * // "99/9 ตำบลศรีภูมิ อำเภอเมืองเชียงใหม่ จังหวัดเชียงใหม่ 50200"
 *
 * @example
 * formatAddress(parts, { prefix: false, separator: ', ' });
 * // "99/9, ศรีภูมิ, เมืองเชียงใหม่, เชียงใหม่, 50200"
 *
 * @example
 * formatAddress(englishParts, { language: 'eng', separator: ', ' });
 * // "99/9, Si Phum, Mueang Chiang Mai, Chiang Mai, 50200"
 */
export const formatAddress = (
    parts: AddressParts,
    options: FormatAddressOptions = {},
): string => {
    const subDistrict = parts.subDistrict ?? parts.sub_district;
    const rawPostalCode = parts.postalCode ?? parts.postal_code;
    const {
        language = inferLanguage([subDistrict, parts.district, parts.province]),
        prefix = language !== LANGUAGE.ENGLISH,
        separator = ' ',
    } = options;

    const words = prefix
        ? prefixSet(language, isBangkok(parts.province))
        : { subDistrict: '', district: '', province: '' };

    // Thai runs the word straight into the name ("ตำบลศรีภูมิ"); English keeps
    // a space ("Tambon Si Phum").
    const gap = language === LANGUAGE.ENGLISH ? ' ' : '';
    const component = (word: string, value: string | undefined): string => {
        const trimmed = value?.trim();
        if (!trimmed) {
            return '';
        }
        return word ? `${word}${gap}${trimmed}` : trimmed;
    };

    const postalCode =
        rawPostalCode === undefined ? '' : String(rawPostalCode).trim();

    return [
        parts.address?.trim(),
        component(words.subDistrict, subDistrict),
        component(words.district, parts.district),
        component(words.province, parts.province),
        postalCode,
    ]
        .filter((piece): piece is string => Boolean(piece))
        .join(separator);
};
