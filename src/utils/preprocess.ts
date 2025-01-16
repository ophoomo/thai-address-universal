import { IExpanded, IThaiAddress } from '../thai-address.d';

interface IProvince {
    length: number;
    [index: number]: string | IAmphoe[];
}

interface IAmphoe {
    length: number;
    [index: number]: string | IDistrict[];
}

interface IDistrict {
    length: number;
    [index: number]: string | string[];
}

export const preprocess = (data: IThaiAddress, eng?: boolean): IExpanded[] => {
    if (!data.data.length) {
        return [];
    }

    const lookup = data.lookup?.split('|') || [];
    const words = data.words?.split('|') || [];
    const useLookup = lookup.length > 0 && words.length > 0;

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

    return data.data.flatMap((provinces: IProvince) => {
        const i = provinces.length === 3 ? 2 : 1;
        return (provinces[i] as IAmphoe[]).flatMap((amphoes: IAmphoe) =>
            (amphoes[i] as IDistrict[]).flatMap((districts: IDistrict) => {
                const districtArray = Array.isArray(districts[i])
                    ? districts[i]
                    : [districts[i]];
                return districtArray.map((zipcode: string) => {
                    const entry: IExpanded = {
                        district: t(districts[0] as string),
                        amphoe: t(amphoes[0] as string),
                        province: t(provinces[0] as string),
                        zipcode: zipcode,
                    };

                    if (i === 2) {
                        entry.district_code = districts[1] as string;
                        entry.amphoe_code = amphoes[1] as string;
                        entry.province_code = provinces[1] as string;
                    }
                    return entry;
                });
            }),
        );
    });
};
