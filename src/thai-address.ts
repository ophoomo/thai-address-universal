import thaiDB from '../database/db.json';
import engDB from '../database/eng_db.json';
import { IExpanded, IExpandedWithPoint } from './types';
import { preprocess } from './utils/preprocess';

import {
    cleanupAddress,
    getBestResult,
    prepareAddress,
} from './utils/split-address';

const db = preprocess(thaiDB);
const dbEng = preprocess(engDB, true);
let engMode = false;

let provinceThaiAllCache: string[] = [];
let provinceEngAllCache: string[] = [];
let AmphoeCache: Map<string, string[]> = new Map();
let DistrictCache: Map<string, string[]> = new Map();
let ZipCodeCache: Map<string, string[]> = new Map();

const get_db = (): IExpanded[] => {
    return engMode ? dbEng : db;
};

const resolveResultbyField = (
    type: keyof IExpanded,
    searchStr: string | number,
    maxResult: number = 20,
): IExpanded[] => {
    searchStr = searchStr.toString().trim().toLowerCase();
    if (searchStr === '') {
        return [];
    }
    let possibles: IExpanded[] = [];
    try {
        possibles = get_db()
            .filter((item) => {
                return (item[type] || '')
                    .toString()
                    .trim()
                    .toLowerCase()
                    .includes(searchStr);
            })
            .slice(0, maxResult);
    } catch (e) {
        console.error('Error during filtering:', e);
        return [];
    }
    return possibles;
};

export const setEngMode = (status: boolean): void => {
    engMode = status;
};

export const getProvinceAll = (): string[] => {
    let cache = engMode ? provinceEngAllCache : provinceThaiAllCache;

    if (cache.length === 0) {
        const provinceSet = new Set<string>();
        get_db().forEach((item) => {
            provinceSet.add(item.province);
        });
        if (engMode) {
            provinceEngAllCache = Array.from(provinceSet);
            cache = provinceEngAllCache;
        } else {
            provinceThaiAllCache = Array.from(provinceSet);
            cache = provinceThaiAllCache;
        }
    }

    return cache;
};

export const getAmphoeByProvince = (province: string): string[] => {
    let data = AmphoeCache.get(province);
    if (!data || data.length === 0) {
        const amphoeSet = new Set<string>();
        get_db().forEach((item) => {
            if (item.province === province) {
                amphoeSet.add(item.amphoe);
            }
        });
        data = Array.from(amphoeSet);
        AmphoeCache.set(province, data);
    }
    return data;
};

export const getDistrictByAmphoe = (amphoe: string): string[] => {
    let data = DistrictCache.get(amphoe);
    if (!data || data.length === 0) {
        const districtSet = new Set<string>();
        get_db().forEach((item) => {
            if (item.amphoe === amphoe) {
                districtSet.add(item.district);
            }
        });
        data = Array.from(districtSet);
        DistrictCache.set(amphoe, data);
    }
    return data;
};

export const getZipCodeByDistrict = (district: string): string[] => {
    let data = ZipCodeCache.get(district);
    if (!data || data.length === 0) {
        const zipCodeSet = new Set<string>();
        get_db().forEach((item) => {
            if (item.district === district) {
                zipCodeSet.add(item.zipcode);
            }
        });
        data = Array.from(zipCodeSet);
        ZipCodeCache.set(district, data);
    }
    return data;
};

export const searchAddressByDistrict = (
    searchStr: string,
    maxResult?: number,
): IExpanded[] => {
    return resolveResultbyField('district', searchStr, maxResult);
};

export const searchAddressByAmphoe = (
    searchStr: string,
    maxResult?: number,
): IExpanded[] => {
    return resolveResultbyField('amphoe', searchStr, maxResult);
};

export const searchAddressByProvince = (
    searchStr: string,
    maxResult?: number,
): IExpanded[] => {
    return resolveResultbyField('province', searchStr, maxResult);
};

export const searchAddressByZipcode = (
    searchStr: string | number,
    maxResult?: number,
): IExpanded[] => {
    return resolveResultbyField('zipcode', searchStr, maxResult);
};

export const splitAddress = (fullAddress: string): IExpanded | null => {
    const regex = /\s(\d{5})(\s|$)/gi;
    const regexResult = regex.exec(fullAddress);
    if (!regexResult) {
        return null;
    }
    const zip = regexResult[1];
    const address = prepareAddress(fullAddress, zip);

    const searchResult: IExpandedWithPoint[] = searchAddressByZipcode(zip);
    const bestResult = getBestResult(searchResult, address);

    if (bestResult) {
        const newAddress = cleanupAddress(address, bestResult);
        return {
            address: newAddress,
            district: bestResult.district,
            amphoe: bestResult.amphoe,
            province: bestResult.province,
            zipcode: zip,
        } as IExpanded;
    }
    return null;
};
