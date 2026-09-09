import {
    GEOCODE_LENGTH,
    LATIN_ALPHABET_SIZE,
    LATIN_CAPITAL_A_CODE_POINT,
    LATIN_LETTER_PATTERN,
    LATIN_SMALL_A_CODE_POINT,
    THAI_CONSONANT_PATTERN,
    THAI_FIRST_CONSONANT_CODE_POINT,
} from '../constants';
import type {
    IDistrict,
    IProvince,
    ISubDistrict,
    IWord,
} from '../types/preprocess';
import type { IExpanded } from '../types/thai-address';
import { ensureGeo } from './helper';

/**
 * Flattens the compressed province → district → sub-district tree into the
 * row list the rest of the library queries.
 *
 * Every node in `data` is `[wordIndex, children]`; `words[wordIndex]` resolves
 * the human-readable name and the leaf's second element is its postal code.
 * When `geos` is supplied it is walked in lock-step (one entry per province,
 * per district, then per sub-district) to attach the standard geocode.
 *
 * @param data - The compressed address tree.
 * @param words - Word table that `wordIndex` values point into.
 * @param geos - Optional flat geocode stream, in the same depth-first order as
 *               `data`. A boolean entry means "no code at this position".
 * @returns One {@link IExpanded} per sub-district.
 */
export const preprocess = (
    data: IProvince[],
    words: string[],
    geos: (number | boolean)[] = [],
): IExpanded[] => {
    if (!data.length || !words.length) {
        return [];
    }

    const expanded: IExpanded[] = [];
    const hasGeo = geos.length > 0;
    let geoIndex = 0;

    for (const province of data) {
        const provinceCode = hasGeo ? ensureGeo(geos[geoIndex++]) : undefined;

        for (const district of province[1] as IDistrict[]) {
            const districtCode = hasGeo
                ? ensureGeo(geos[geoIndex++])
                : undefined;

            for (const subDistrict of district[1] as ISubDistrict[]) {
                const entry: IExpanded = {
                    province: words[province[0] as number],
                    district: words[district[0] as number],
                    sub_district: words[subDistrict[0] as number],
                    postal_code: subDistrict[1].toString(),
                };

                if (hasGeo) {
                    const subDistrictCode = ensureGeo(geos[geoIndex++]);
                    entry.sub_district_code = subDistrictCode;
                    entry.province_code = provinceCode;

                    // A few source entries carry a boolean in the district
                    // slot, which `ensureGeo` flattens to "". The standard
                    // geocode is hierarchical, so recover the district code
                    // from the first `GEOCODE_LENGTH.DISTRICT` digits of the
                    // sub-district code rather than emitting an empty string.
                    const canDeriveDistrict =
                        subDistrictCode.length === GEOCODE_LENGTH.SUB_DISTRICT;
                    entry.district_code =
                        districtCode ||
                        (canDeriveDistrict
                            ? subDistrictCode.slice(0, GEOCODE_LENGTH.DISTRICT)
                            : districtCode);
                }

                expanded.push(entry);
            }
        }
    }

    return expanded;
};

/**
 * Decodes a compressed {@link IWord} table into a plain string array.
 *
 * The source stores each name either as a literal string or, when a `lookup`
 * table is present, as an index into it. Names in the lookup are themselves
 * run-length encoded: single letters stand in for the most common whole words,
 * which this function expands back out.
 *
 * @param data - The compressed word table.
 * @param decodeThaiCodePoints - When `true`, encoded letters are Thai code
 *        points (the English dataset stores Thai substitution markers, and
 *        vice-versa). Defaults to `false`.
 * @returns The fully decoded list of names.
 */
export const preprocess_word = (
    data: IWord,
    decodeThaiCodePoints = false,
): string[] => {
    if (!data.data?.length) {
        return [];
    }

    const lookup = data.lookup?.split('|') ?? [];
    const words = data.words?.split('|') ?? [];
    const useLookup = lookup.length > 0 && words.length > 0;

    /**
     * Expands a single encoded letter back to the whole word it stands for.
     * Thai code points index directly; Latin ones map A–Z then a–z.
     */
    const expandLetter = (letter: string): string => {
        const codePoint = letter.charCodeAt(0);
        if (decodeThaiCodePoints) {
            return words[codePoint - THAI_FIRST_CONSONANT_CODE_POINT];
        }
        const isCapital = codePoint < LATIN_SMALL_A_CODE_POINT;
        return words[
            isCapital
                ? codePoint - LATIN_CAPITAL_A_CODE_POINT
                : LATIN_ALPHABET_SIZE + codePoint - LATIN_SMALL_A_CODE_POINT
        ];
    };

    // The encoded letters belong to the *other* script than the output text.
    const encodedLetterPattern = decodeThaiCodePoints
        ? THAI_CONSONANT_PATTERN
        : LATIN_LETTER_PATTERN;

    /** Resolves one `data` entry (string literal or lookup index) to its name. */
    const resolveEntry = (entry: string | number): string => {
        if (!useLookup) {
            return entry.toString();
        }
        const encoded =
            typeof entry === 'number' ? lookup[entry] : String(entry);
        return encoded.replace(encodedLetterPattern, expandLetter);
    };

    return data.data.map(resolveEntry);
};
