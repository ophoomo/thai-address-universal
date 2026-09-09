import {
    BANGKOK_CANONICAL_NAME,
    BANGKOK_ENGLISH_NAME,
    COMPONENT_PREFIX,
    LANGUAGE,
    type Language,
} from '../constants';

/** The pieces of an address that {@link formatAddress} assembles. */
export interface AddressParts {
    /** House number / street / village — printed first, verbatim. */
    address?: string;
    /** ตำบล / แขวง. */
    subDistrict?: string;
    /** อำเภอ / เขต. */
    district?: string;
    /** จังหวัด. */
    province?: string;
    /** 5-digit postal code — printed last. */
    postalCode?: string | number;
}

/** Options for {@link formatAddress}. */
export interface FormatAddressOptions {
    /**
     * Language of the component-introducing words ("ตำบล" vs "Tambon").
     * Defaults to Thai. Only affects output when `prefix` is `true`.
     */
    language?: Language;
    /**
     * Prefix each component with its administrative word (ตำบล / อำเภอ / …,
     * or แขวง / เขต for Bangkok). Defaults to `true`.
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
 * default) each component is introduced by its administrative word, switching
 * to แขวง / เขต automatically when the province is Bangkok.
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
 */
export const formatAddress = (
    parts: AddressParts,
    options: FormatAddressOptions = {},
): string => {
    const {
        language = LANGUAGE.THAI,
        prefix = true,
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
        parts.postalCode === undefined || parts.postalCode === ''
            ? ''
            : String(parts.postalCode);

    return [
        parts.address?.trim(),
        component(words.subDistrict, parts.subDistrict),
        component(words.district, parts.district),
        component(words.province, parts.province),
        postalCode,
    ]
        .filter((piece): piece is string => Boolean(piece))
        .join(separator);
};
