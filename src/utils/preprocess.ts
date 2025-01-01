import { IExpanded, IThaiAddress } from '../types';

export const preprocess = (data: IThaiAddress, eng?: boolean): IExpanded[] => {
    let lookup: string[] = [];
    let words: string[] = [];
    let expanded: IExpanded[] = [];
    let useLookup = false;

    if (data.lookup && data.words) {
        // compact with dictionary and lookup
        useLookup = true;
        lookup = data.lookup.split('|');
        words = data.words.split('|');
        data = { data: data.data } as IThaiAddress; // Reassign to avoid mutation
    }

    const t = (text: string | number): string => {
        function repl(m: string): string {
            const ch = m.charCodeAt(0);
            if (eng) {
                return words[ch - 3585];
            } else {
                return words[ch < 97 ? ch - 65 : 26 + ch - 97];
            }
        }
        if (!useLookup) {
            return text.toString();
        }
        if (typeof text === 'number') {
            text = lookup[text];
        }
        if (eng) {
            return text.replace(/[ก-ฮ]/gi, repl);
        } else {
            return text.toString().replace(/[A-Z]/gi, repl);
        }
    };

    if (!data.data.length) {
        // non-compacted database
        return expanded;
    }

    // decompacted database in hierarchical form of:
    // [["province",[["amphur",[["district",["zip"...]]...]]...]]...]
    data.data.map(function (provinces: any) {
        var i = 1;
        if (provinces.length === 3) {
            // geographic database
            i = 2;
        }
        provinces[i].map(function (amphoes: any) {
            amphoes[i].map(function (districts: any) {
                districts[i] =
                    districts[i] instanceof Array
                        ? districts[i]
                        : [districts[i]];
                districts[i].map(function (zipcode: any) {
                    const entry: IExpanded = {
                        district: t(districts[0]),
                        amphoe: t(amphoes[0]),
                        province: t(provinces[0]),
                        zipcode: zipcode,
                    };
                    if (i === 2) {
                        // geographic database
                        entry.district_code = districts[1];
                        entry.amphoe_code = amphoes[1];
                        entry.province_code = provinces[1];
                    }
                    expanded.push(entry);
                });
            });
        });
    });
    return expanded;
};
