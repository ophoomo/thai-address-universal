import { IExpanded } from '../thai-address.d';
import { IDistrict, IProvince, ISubDistrict, IWord } from './preprocess.d';

/**
 *
 * @param data
 * @returns
 */
export const preprocess = (data: IProvince[]): IExpanded[] => {
    if (!data.length) {
        return [];
    }

    const expanded: IExpanded[] = [];
    const i = 2;
    data.forEach((provinces: IProvince) => {
        (provinces[i] as IDistrict[]).forEach((districts: IDistrict) => {
            (districts[i] as ISubDistrict[]).forEach(
                (subDistricts: ISubDistrict) => {},
            );
        });
    });
    return expanded;
};

/**
 *
 * @param data
 * @param eng
 * @returns
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

    const repl = (m: string, eng: boolean): string => {
        const ch = m.charCodeAt(0);
        return eng ? words[ch - 3585] : words[ch < 97 ? ch - 65 : 26 + ch - 97];
    };

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
