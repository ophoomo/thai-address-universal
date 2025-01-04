import { IExpanded, IThaiAddress } from '../thai-address.d';

export const preprocess = (data: IThaiAddress, eng?: boolean): IExpanded[] => {
    const expanded: IExpanded[] = [];

    let lookup: string[] = [];
    let words: string[] = [];
    let useLookup = false;

    if (data.lookup && data.words) {
        useLookup = true;
        lookup = data.lookup.split('|');
        words = data.words.split('|');
    }

    const repl = (m: string): string => {
        const ch = m.charCodeAt(0);
        return eng ? words[ch - 3585] : words[ch < 97 ? ch - 65 : 26 + ch - 97];
    };

    const t = (text: string | number): string => {
        if (!useLookup) {
            return text.toString();
        }
        if (typeof text === 'number') {
            text = lookup[text];
        }
        return eng
            ? text.replace(/[ก-ฮ]/gi, repl)
            : text.toString().replace(/[A-Z]/gi, repl);
    };

    if (!data.data.length) {
        return expanded;
    }

    data.data.forEach((provinces: any) => {
        const i = provinces.length === 3 ? 2 : 1;
        provinces[i].forEach((amphoes: any) => {
            amphoes[i].forEach((districts: any) => {
                const districtArray = Array.isArray(districts[i])
                    ? districts[i]
                    : [districts[i]];
                districtArray.forEach((zipcode: any) => {
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

export const preprocessAddress = (address: string): string => {
    const replacements = [
        'Thailand', 'ต.', 'อ.', 'จ.', 'ตำบล', 'อำเภอ', 'จังหวัด', 'แขวง', 'เขต', 'แขวง.', 'เขต.',
        ' กทม. ', ' กทม ', ' กรุงเทพ '
    ];
    replacements.forEach(replacement => {
        address = address.replace(new RegExp(replacement, 'g'), '');
    });
    return address.replace(' กทม ', ' กรุงเทพมหานคร ').trim();
};
