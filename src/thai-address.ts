import thaiDB from '../database/db.json';
import engDB from '../database/eng_db.json';
import { IExpanded, IExpandedWithPoint } from './thai-address.d';
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

const get_db = (): IExpanded[] => (engMode ? dbEng : db);

const cacheResult = (
    cache: Map<string, string[]>,
    key: string,
    fetchFunc: () => Set<string>
): string[] => {
    if (!cache.has(key)) {
        cache.set(key, Array.from(fetchFunc()));
    }
    return cache.get(key) || [];
};

const resolveResultbyField = (
    type: keyof IExpanded,
    searchStr: string | number,
    maxResult: number = 20
): IExpanded[] => {
    searchStr = searchStr.toString().trim().toLowerCase();
    if (searchStr === '') return [];
    try {
        return get_db()
            .filter((item) =>
                (item[type] || '').toString().trim().toLowerCase().includes(searchStr)
            )
            .slice(0, maxResult);
    } catch (e) {
        console.error('Error during filtering:', e);
        return [];
    }
};

export const setEngMode = (status: boolean): void => {
    engMode = status;
};

export const getProvinceAll = (): string[] => {
    const cache = engMode ? provinceEngAllCache : provinceThaiAllCache;
    if (cache.length === 0) {
        const provinceSet = new Set<string>();
        get_db().forEach((item) => provinceSet.add(item.province));
        if (engMode) provinceEngAllCache = Array.from(provinceSet);
        else provinceThaiAllCache = Array.from(provinceSet);
    }
    return engMode ? provinceEngAllCache : provinceThaiAllCache;
};

export const getAmphoeByProvince = (province: string): string[] =>
    cacheResult(AmphoeCache, province, () => {
        const amphoeSet = new Set<string>();
        get_db().forEach((item) => {
            if (item.province === province) amphoeSet.add(item.amphoe);
        });
        return amphoeSet;
    });

export const getDistrictByAmphoe = (amphoe: string): string[] =>
    cacheResult(DistrictCache, amphoe, () => {
        const districtSet = new Set<string>();
        get_db().forEach((item) => {
            if (item.amphoe === amphoe) districtSet.add(item.district);
        });
        return districtSet;
    });

export const getZipCodeByDistrict = (district: string): string[] =>
    cacheResult(ZipCodeCache, district, () => {
        const zipCodeSet = new Set<string>();
        get_db().forEach((item) => {
            if (item.district === district) zipCodeSet.add(item.zipcode);
        });
        return zipCodeSet;
    });

export const searchAddressByDistrict = (
    searchStr: string,
    maxResult?: number
): IExpanded[] => resolveResultbyField('district', searchStr, maxResult);

export const searchAddressByAmphoe = (
    searchStr: string,
    maxResult?: number
): IExpanded[] => resolveResultbyField('amphoe', searchStr, maxResult);

export const searchAddressByProvince = (
    searchStr: string,
    maxResult?: number
): IExpanded[] => resolveResultbyField('province', searchStr, maxResult);

export const searchAddressByZipcode = (
    searchStr: string | number,
    maxResult?: number
): IExpanded[] => resolveResultbyField('zipcode', searchStr, maxResult);

export const splitAddress = (fullAddress: string): IExpanded | null => {
    const regex = /\s(\d{5})(\s|$)/gi;
    const regexResult = regex.exec(fullAddress);
    if (!regexResult) return null;
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
