import thaiDB from '../database/db.json';
import { IExpanded, IExpandedWithPoint } from './types';
import { preprocess } from './utils/preprocess';

import {
    cleanupAddress,
    getBestResult,
    prepareAddress,
} from './utils/split-address';

const db = preprocess(thaiDB);

const resolveResultbyField = (
    type: keyof IExpanded,
    searchStr: string | number,
    maxResult?: number,
): IExpanded[] => {
    searchStr = searchStr.toString().trim();
    if (searchStr === '') {
        return [];
    }
    if (!maxResult) {
        maxResult = 20;
    }
    let possibles = [];
    try {
        possibles = db
            .filter((item) => {
                const regex = new RegExp(searchStr, 'g');
                return (item[type] || '').toString().match(regex);
            })
            .slice(0, maxResult);
    } catch (e) {
        return [];
    }
    return possibles;
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
