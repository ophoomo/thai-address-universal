import thaiAddressDB from '../migrate/output/db.json';
import { IExpanded, IExpandedWithPoint } from './thai-address.d';
import { IProvince } from './utils/preprocess.d';
import { preprocess } from './utils/preprocess';
import {
    cleanupAddress,
    getBestResult,
    prepareAddress,
} from './utils/split-address';

/**
 *
 */
const db = preprocess(thaiAddressDB as IProvince[]);

/**
 *
 */
let engMode = false;

/**
 *
 */
const provinceCache: { [key: string]: string[] } = { thai: [], eng: [] };
const districtCache: Map<string, string[]> = new Map();
const subDistrictCache: Map<string, string[]> = new Map();
const zipCodeCache: Map<string, string[]> = new Map();

/**
 *
 * @param cache
 * @param key
 * @param fetchFunc
 * @returns
 */
const cacheResult = (
    cache: Map<string, string[]>,
    key: string,
    fetchFunc: () => Set<string>,
): string[] => {
    if (!cache.has(key)) {
        cache.set(key, Array.from(fetchFunc()));
    }
    return cache.get(key) || [];
};

/**
 *
 * @param type
 * @param searchStr
 * @param maxResult
 * @returns
 */
const resolveResultbyField = (
    type: keyof IExpanded,
    searchStr: string | number,
    maxResult: number = 20,
): IExpanded[] => {
    searchStr = searchStr.toString().trim().toLowerCase();
    if (searchStr === '') return [];
    try {
        return db
            .filter((item) =>
                (item[type] || '')
                    .toString()
                    .trim()
                    .toLowerCase()
                    .includes(searchStr),
            )
            .slice(0, maxResult);
    } catch (e) {
        console.error('Error during filtering:', e);
        return [];
    }
};

/**
 *
 * @param status
 */
export const setEngMode = (status: boolean): void => {
    engMode = status;
};

/**
 *
 * @returns
 */
export const getProvinceAll = (): string[] => {
    const cacheKey = engMode ? 'eng' : 'thai';
    if (provinceCache[cacheKey].length === 0) {
        const provinceSet = new Set<string>();
        db.forEach((item) => provinceSet.add(item.province));
        provinceCache[cacheKey] = Array.from(provinceSet);
    }
    return provinceCache[cacheKey];
};

/**
 *
 * @param province
 * @returns
 */
export const getDistrictByProvince = (province: string): string[] =>
    cacheResult(districtCache, province, () => {
        const districtSet = new Set<string>();
        db.forEach((item) => {
            if (item.province === province) districtSet.add(item.district);
        });
        return districtSet;
    });

/**
 *
 * @param district
 * @returns
 */
export const getSubDistrictByDistrict = (district: string): string[] =>
    cacheResult(subDistrictCache, district, () => {
        const subDistrictSet = new Set<string>();
        db.forEach((item) => {
            if (item.district === district)
                subDistrictSet.add(item.sub_district);
        });
        return subDistrictSet;
    });

/**
 *
 * @param sub_district
 * @returns
 */
export const getZipCodeByDistrict = (sub_district: string): string[] =>
    cacheResult(zipCodeCache, sub_district, () => {
        const zipCodeSet = new Set<string>();
        db.forEach((item) => {
            if (item.district === sub_district) zipCodeSet.add(item.zipcode);
        });
        return zipCodeSet;
    });

/**
 *
 * @param field
 * @param searchStr
 * @param maxResult
 * @returns
 */
const searchAddressByField = (
    field: keyof IExpanded,
    searchStr: string | number,
    maxResult?: number,
): IExpanded[] => resolveResultbyField(field, searchStr, maxResult);

/**
 *
 * @param searchStr
 * @param maxResult
 * @returns
 */
export const searchAddressBySubDistrict = (
    searchStr: string,
    maxResult?: number,
): IExpanded[] => searchAddressByField('sub_district', searchStr, maxResult);

/**
 *
 * @param searchStr
 * @param maxResult
 * @returns
 */
export const searchAddressByDistrict = (
    searchStr: string,
    maxResult?: number,
): IExpanded[] => searchAddressByField('district', searchStr, maxResult);

/**
 *
 * @param searchStr
 * @param maxResult
 * @returns
 */
export const searchAddressByProvince = (
    searchStr: string,
    maxResult?: number,
): IExpanded[] => searchAddressByField('province', searchStr, maxResult);

/**
 *
 * @param searchStr
 * @param maxResult
 * @returns
 */
export const searchAddressByZipCode = (
    searchStr: string | number,
    maxResult?: number,
): IExpanded[] => searchAddressByField('zipcode', searchStr, maxResult);

/**
 *
 * @param fullAddress
 * @returns
 */
export const splitAddress = (fullAddress: string): IExpanded | null => {
    const regex = /\s(\d{5})(\s|$)/gi;
    const regexResult = regex.exec(fullAddress);
    if (!regexResult) return null;
    const zip = regexResult[1];
    const address = prepareAddress(fullAddress, zip);

    const searchResult: IExpandedWithPoint[] = searchAddressByZipCode(zip);
    const bestResult = getBestResult(searchResult, address);

    if (bestResult) {
        const newAddress = cleanupAddress(address, bestResult);
        return {
            address: newAddress,
            district: bestResult.district,
            district_en: bestResult.district,
            sub_district: bestResult.sub_district,
            sub_district_en: bestResult.sub_district,
            province: bestResult.province,
            province_en: bestResult.province,
            zipcode: zip,
        } as IExpanded;
    }
    return null;
};
