import { IExpanded } from '../types/thai-address';
import { DatabaseFactory } from './database';
import { SearchRepository } from './search';
import { Address } from './address';
import { Translate } from './translate';
import { Geo } from './geo';
import { getDefaultLanguage } from '../utils/helper';
import { IDatabase } from '../types/database';
import { ISearch } from '../types/search';
import { IAddress } from '../types/address';
import { ITranslate } from '../types/translate';

let database: IDatabase;
let databasePromise: Promise<IDatabase>;
let search: ISearch;
let address: IAddress;
let translate: ITranslate;

/**
 * Initializes the database and related repositories.
 * This function creates a new database instance using the default language,
 * and initializes the search, address, and translate repositories.
 */
const initializeDatabase = async (): Promise<void> => {
    databasePromise = DatabaseFactory.createDatabase(getDefaultLanguage());
    database = await databasePromise;
    search = new SearchRepository(database);
    address = new Address(database);
    translate = new Translate();
};
initializeDatabase();

/**
 * Ensures that the database is initialized before use.
 * If the database is not initialized yet, this function will call `initializeDatabase` to initialize it.
 */
const ensureDatabaseInitialized = async (): Promise<void> => {
    if (!(await databasePromise)) {
        await initializeDatabase();
    }
};

/**
 * Retrieves all data from the current database.
 * @returns An array of expanded address data.
 */
export const getDatabase = (): IExpanded[] => {
    return database.getData();
};

/**
 * Checks if geo mode is enabled (i.e., if geo data is available).
 * @returns True if geo mode is enabled, otherwise false.
 */
export const getGeoMode = (): boolean =>
    database.getGeo() !== undefined ? true : false;

/**
 * Enables or disables geo mode by creating or clearing the Geo instance.
 * @param status - True to enable geo mode, false to disable.
 */
export const setGeoMode = async (status: boolean): Promise<void> => {
    if (status) {
        const geo = new Geo();
        await geo.load();
        DatabaseFactory.createGeo(geo);
    } else {
        DatabaseFactory.clearGeo();
    }
};

/**
 * Checks if English mode is enabled (i.e., if the database is set to English).
 * @returns True if English mode is enabled, otherwise false.
 */
export const getEngMode = (): boolean =>
    database.name === 'eng' ? true : false;

/**
 * Enables or disables English mode by switching the database between Thai and English.
 * @param status - True to enable English mode, false to disable.
 */
export const setEngMode = async (status: boolean): Promise<void> => {
    await ensureDatabaseInitialized();
    if (status) database = await DatabaseFactory.createDatabase('eng');
    else database = await DatabaseFactory.createDatabase('thai');

    // Update the database for search and address services
    search.setDatabase(database);
    address.setDatabase(database);
};

/**
 * Retrieves all unique provinces from the database.
 * @returns An array of province names.
 */
export const getProvinceAll = async (): Promise<string[]> => {
    await ensureDatabaseInitialized();
    return address.getProvinceAll();
};

/**
 * Retrieves districts for a given province.
 * @param province - The province to filter districts by.
 * @returns An array of district names.
 */
export const getDistrictByProvince = async (
    province: string,
): Promise<string[]> => {
    await ensureDatabaseInitialized();
    return address.getDistrictByProvince(province);
};

/**
 * Retrieves sub-districts for a given district.
 * @param district - The district to filter sub-districts by.
 * @returns An array of sub-district names.
 */
export const getSubDistrictByDistrict = async (
    district: string,
): Promise<string[]> => {
    await ensureDatabaseInitialized();
    return address.getSubDistrictByDistrict(district);
};

/**
 * Retrieves postal codes for a given sub-district.
 * @param sub_district - The sub-district to filter postal codes by.
 * @returns An array of postal codes.
 */
export const getPostalCodeBySubDistrict = async (
    sub_district: string,
): Promise<string[]> => {
    await ensureDatabaseInitialized();
    return address.getPostalCodeBySubDistrict(sub_district);
};

/**
 * Searches for addresses by province.
 * @param searchStr - The search string for the province.
 * @param maxResult - Optional limit on the number of results.
 * @returns An array of matching address data.
 */
export const searchAddressByProvince = async (
    searchStr: string,
    maxResult?: number,
): Promise<IExpanded[]> => {
    await ensureDatabaseInitialized();
    return search.searchAddressByProvince(searchStr, maxResult);
};

/**
 * Searches for addresses by district.
 * @param searchStr - The search string for the district.
 * @param maxResult - Optional limit on the number of results.
 * @returns An array of matching address data.
 */
export const searchAddressByDistrict = async (
    searchStr: string,
    maxResult?: number,
): Promise<IExpanded[]> => {
    await ensureDatabaseInitialized();
    return search.searchAddressByDistrict(searchStr, maxResult);
};

/**
 * Searches for addresses by sub-district.
 * @param searchStr - The search string for the sub-district.
 * @param maxResult - Optional limit on the number of results.
 * @returns An array of matching address data.
 */
export const searchAddressBySubDistrict = async (
    searchStr: string,
    maxResult?: number,
): Promise<IExpanded[]> => {
    await ensureDatabaseInitialized();
    return search.searchAddressBySubDistrict(searchStr, maxResult);
};

/**
 * Searches for addresses by postal code.
 * @param searchStr - The search string for the postal code (can be string or number).
 * @param maxResult - Optional limit on the number of results.
 * @returns An array of matching address data.
 */
export const searchAddressByPostalCode = async (
    searchStr: string | number,
    maxResult?: number,
): Promise<IExpanded[]> => {
    await ensureDatabaseInitialized();
    return search.searchAddressByPostalCode(searchStr, maxResult);
};

/**
 * Splits a full address string into its components (province, district, sub-district, postal code).
 * @param fullAddress - The full address string to split.
 * @returns An object containing the address components, or null if parsing fails.
 */
export const splitAddress = async (
    fullAddress: string,
): Promise<IExpanded | null> => {
    await ensureDatabaseInitialized();
    return search.splitAddress(fullAddress);
};

/**
 * Translates a word between Thai and English.
 * @param text - The word to translate.
 * @returns The translated word, or the original word if no translation is found.
 */
export const translateWord = async (text: string): Promise<string> =>
    await translate.translateWord(text);
