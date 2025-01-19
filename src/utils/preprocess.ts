import { IExpanded } from '../thai-address.d';
import { IDistrict, IProvince, ISubDistrict, IWord } from './preprocess.d';

/**
 * This function processes a nested data structure of provinces, districts, and sub-districts,
 * and maps it to a flat structure containing expanded details of each sub-district with corresponding
 * postal codes and labels based on provided words.
 *
 * @param data - An array of provinces where each province contains an array of districts,
 *               and each district contains an array of sub-districts.
 * @param words - An array of words used to map numeric indices in provinces, districts,
 *                and sub-districts to human-readable names.
 *
 * @returns An array of IExpanded objects, each containing:
 *          - province name
 *          - district name
 *          - sub-district name
 *          - postal code as a string
 */
export const preprocess = (data: IProvince[], words: string[]): IExpanded[] => {
    if (!data.length) {
        return [];
    }

    const expanded: IExpanded[] = [];
    const i = 1;
    data.forEach((provinces: IProvince) => {
        (provinces[i] as IDistrict[]).forEach((districts: IDistrict) => {
            (districts[i] as ISubDistrict[]).forEach(
                (subDistricts: ISubDistrict) => {
                    const entry: IExpanded = {
                        province: words[provinces[0] as number],
                        district: words[districts[0] as number],
                        sub_district: words[subDistricts[0]],
                        postal_code: subDistricts[1].toString(),
                    };
                    expanded.push(entry);
                },
            );
        });
    });
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
    if (!data.data.length) {
        return [];
    }

    const lookup = data.lookup?.split('|') || [];
    const words = data.words?.split('|') || [];
    const useLookup = lookup.length > 0 && words.length > 0;

    /**
     * The `repl` function is used to replace a character with its mapped value from the `words` array.
     * @param m The character to be transformed.
     * @param eng If true, uses the English mapping from `words`, otherwise uses Thai mapping.
     * @returns The transformed character.
     */
    const repl = (m: string, eng: boolean): string => {
        const ch = m.charCodeAt(0);
        return eng ? words[ch - 3585] : words[ch < 97 ? ch - 65 : 26 + ch - 97];
    };

    /**
     * The `t` function is used to transform the text by replacing characters based on the `lookup` or `words` data.
     * @param text The text to be transformed.
     * @param eng If true, the function processes English characters; otherwise, it processes Thai.
     * @returns The transformed text.
     */
    const t = (text: string | number, eng: boolean): string => {
        if (!useLookup) {
            return text.toString();
        }
        if (typeof text === 'number') {
            text = lookup[text];
        }
        return eng
            ? text.replace(/[ก-ฮ]/gi, (m) => repl(m, eng))
            : text.replace(/[a-zA-Z]/gi, (m) => repl(m, eng));
    };

    return data.data.map((item) => t(item, eng));
};
