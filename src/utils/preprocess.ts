import { IExpanded } from '../types/thai-address.d';
import { ensureGeo } from './helper';
import { IDistrict, IProvince, ISubDistrict, IWord } from '../types/preprocess';

/**
 * This function processes a nested data structure of provinces, districts, and sub-districts,
 * and maps it to a flat structure containing expanded details of each sub-district with corresponding
 * postal codes and labels based on provided words.
 *
 * @param data - An array of provinces where each province contains an array of districts,
 *               and each district contains an array of sub-districts.
 * @param words - An array of words used to map numeric indices in provinces, districts,
 *                and sub-districts to human-readable names.
 * @param geos Optional 2D array of geo IDs, where each entry is an array of numbers representing
 *             specific geographic identifiers (e.g., province, district, or sub-district) that
 *             correspond to the locations in the data. These geo IDs can be used to filter or
 *             match specific regions in the dataset.
 *
 * @returns An array of IExpanded objects, each containing:
 *          - province name
 *          - district name
 *          - sub-district name
 *          - postal code as a string
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
                    entry.province_code = provinceCode;
                    entry.district_code = districtCode;
                    entry.sub_district_code = ensureGeo(geos[geoIndex++]);
                }

                expanded.push(entry);
            }
        }
    }

    return expanded;
};

/**
 * The `preprocess_word` function is used to transform word data from an `IWord` object
 * into an array of strings. It also allows for conditional processing based on whether
 * the transformation should be done for English or not (through the `eng` parameter).
 *
 * @param data The `IWord` object containing the word data to be processed.
 * @param eng A boolean flag that, if true, will process the data in English, otherwise it processes in Thai.
 * @returns An array of strings that have been processed and transformed.
 */
export const preprocess_word = (
    data: IWord,
    eng: boolean = false,
): string[] => {
    if (!data.data?.length) {
        return [];
    }

    const lookup = data.lookup?.split('|') ?? [];
    const words = data.words?.split('|') ?? [];
    const useLookup = lookup.length > 0 && words.length > 0;

    /**
     * The `repl` function is used to replace a character with its mapped value from the `words` array.
     * @param m The character to be transformed.
     * @param isEnglish If true, uses the English mapping from `words`, otherwise uses Thai mapping.
     * @returns The transformed character.
     */
    const repl = (m: string, isEnglish: boolean): string => {
        const ch = m.charCodeAt(0);
        return isEnglish
            ? words[ch - 3585]
            : words[ch < 97 ? ch - 65 : 26 + ch - 97];
    };

    // Pre-compile regex patterns
    const thaiCharRegex = /[ก-ฮ]/g;
    const englishCharRegex = /[a-zA-Z]/g;

    /**
     * The `t` function is used to transform the text by replacing characters based on the `lookup` or `words` data.
     * @param text The text to be transformed.
     * @param isEnglish If true, the function processes English characters; otherwise, it processes Thai.
     * @returns The transformed text.
     */
    const t = (text: string | number, isEnglish: boolean): string => {
        if (!useLookup) {
            return text.toString();
        }

        const transformedText =
            typeof text === 'number' ? lookup[text] : String(text);

        const charRegex = isEnglish ? thaiCharRegex : englishCharRegex;
        return transformedText.replace(charRegex, (m) => repl(m, isEnglish));
    };

    return data.data.map((item) => t(item, eng));
};
