import thaiAddressDB from '../migrate/output/db.json';
import { IExpanded, IExpandedWithPoint } from './thai-address.d';
import { IProvince } from './utils/preprocess.d';
import { preprocess, preprocess_word } from './utils/preprocess';
import {
    cleanupAddress,
    getBestResult,
    prepareAddress,
} from './utils/split-address';

/**
 * The thaiDB variable is used to store expanded data for the Thai language.
 * The data is stored as an array of IExpanded type.
 */
let thaiDB: IExpanded[] = [];

/**
 * The engDB variable is used to store expanded data for the English language.
 * The data is stored as an array of IExpanded type.
 */
let engDB: IExpanded[] = [];

/**
 * Declare an empty array to store Thai words.
 */
let thaiWords: string[] = [];

/**
 * Declare an empty array to store English words.
 */
let engWords: string[] = [];

/**
 * This variable controls the English mode of the application.
 * If 'engMode' is true, the application will use English language settings.
 * If 'engMode' is false, the application will use the default language settings.
 */
let engMode = false;

/**
 * Caches for storing information related to provinces, districts, sub-districts, and postal codes.
 *
 * - `provinceCache`: An object with keys for language codes ('thai', 'eng') and values as arrays
 *   of province names in respective languages.
 * - `districtCache`: A Map that stores arrays of district names indexed by a string key (e.g., province name).
 * - `subDistrictCache`: A Map that stores arrays of sub-district names indexed by a string key (e.g., district name).
 * - `PostalCodeCache`: A Map that stores arrays of postal codes indexed by a string key (e.g., sub-district name).
 */
const provinceCache: { [key: string]: string[] } = { thai: [], eng: [] };
const districtCache: Map<string, string[]> = new Map();
const subDistrictCache: Map<string, string[]> = new Map();
const PostalCodeCache: Map<string, string[]> = new Map();

/**
 *  flag to track if the database is being loaded for each language
 */
let isEngDBLoaded = false;
let isThaiDBLoaded = false;

/**
 * Loads the Thai database and processes it.
 * Imports the Thai database JSON file, processes the data using `preprocess_word` and `preprocess` functions,
 * and sets the global variable `isThaiDBLoaded` to true when the data is successfully loaded.
 * If an error occurs, it logs the error message to the console.
 */
export const loadThaiDatabase = async () => {
    try {
        const data = await import('../migrate/output/th_db.json');
        thaiWords = preprocess_word(data, false);
        thaiDB = preprocess(thaiAddressDB as IProvince[], thaiWords);
        isThaiDBLoaded = true;
    } catch (err) {
        console.error('Error loading Thai database', err);
    }
};

/**
 * Loads the English database and processes it.
 * Imports the English database JSON file, processes the data using `preprocess_word` and `preprocess` functions,
 * and sets the global variable `isEngDBLoaded` to true when the data is successfully loaded.
 * If an error occurs, it logs the error message to the console.
 */
export const loadEngDatabase = async () => {
    try {
        const data = await import('../migrate/output/en_db.json');
        engWords = preprocess_word(data, true);
        engDB = preprocess(thaiAddressDB as IProvince[], engWords);
        isEngDBLoaded = true;
    } catch (err) {
        console.error('Error loading English database', err);
    }
};

/**
 * The setupDatabase function initializes the appropriate language database (either Thai or English).
 * It checks if the corresponding database is empty, and if so, imports the necessary JSON file and processes the data.
 *
 * If the language mode is English (engMode is true), it loads and processes the English database (en_db).
 * If the language mode is Thai (engMode is false), it loads and processes the Thai database (th_db).
 *
 * The imported JSON data is processed using the `preprocess` function and a `preprocess_word` function.
 * The `thaiAddressDB` is used as part of the preprocessing for both languages.
 */
const setupDatabase = async () => {
    if (engMode && !isEngDBLoaded) {
        await loadEngDatabase();
    } else if (!engMode && !isThaiDBLoaded) {
        await loadThaiDatabase();
    }
};

/**
 * The db function returns the appropriate expanded database based on the current language mode.
 * It first calls the setupDatabase function to ensure the corresponding language database is initialized.
 * Then, it returns either the English database (en_db) or the Thai database (th_db) depending on the value of `engMode`.
 *
 * @returns {Promise<IExpanded[]>} The corresponding expanded database (either en_db or th_db).
 */
export const db = async (): Promise<IExpanded[]> => {
    await setupDatabase();
    return engMode ? engDB : thaiDB;
};

/**
 * Caches the result of a fetch operation and returns the cached data.
 *
 * This function checks if the cache contains the data for the given key. If not, it calls the
 * provided `fetchFunc` to retrieve the data, stores it in the cache, and then returns it.
 *
 * @param cache - A Map where the key is a string and the value is an array of strings, acting as the cache.
 * @param key - The key used to store and retrieve data from the cache.
 * @param fetchFunc - A function that fetches a Set of strings when data is not found in the cache.
 * @returns An array of strings representing the cached or fetched data.
 */
const cacheResult = async (
    cache: Map<string, string[]>,
    key: string,
    fetchFunc: () => Promise<Set<string>>,
): Promise<string[]> => {
    if (!cache.has(key)) {
        cache.set(key, Array.from(await fetchFunc()));
    }
    return cache.get(key) || [];
};

/**
 * Resolves the search results by a specified field from the database.
 *
 * This function filters the items in the database based on the provided search string.
 * It checks if the field specified by `type` contains the `searchStr` (case-insensitive).
 * The results are limited to a maximum number specified by `maxResult` (default is 20).
 *
 * @param {keyof IExpanded} type - The field of the items to search in.
 * @param {string | number} searchStr - The string or number to search for.
 * @param {number} [maxResult=20] - The maximum number of results to return (optional, default is 20).
 * @returns {Promise<IExpanded[]>} - A filtered array of items from the database that match the search criteria.
 */
export const resolveResultbyField = async (
    type: keyof IExpanded,
    searchStr: string | number,
    maxResult: number = 20,
): Promise<IExpanded[]> => {
    searchStr = searchStr.toString().trim().toLowerCase();
    if (searchStr === '') return [];
    try {
        return (await db())
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
 * Sets the English mode status.
 * This function updates the 'engMode' variable based on the provided 'status' value.
 *
 * @param status - A boolean value to set the English mode.
 *                 If true, the English mode is enabled.
 *                 If false, the English mode is disabled.
 */
export const setEngMode = (status: boolean): void => {
    engMode = status;
    setupDatabase();
};

/**
 * Retrieves all unique provinces from the database, either in English or Thai, based on the current language mode.
 * If the province data is not already cached, it will extract the provinces from the database and store them in the cache.
 *
 * @returns A list of unique provinces (strings) in the current language mode (either English or Thai).
 */
export const getProvinceAll = async (): Promise<string[]> => {
    const cacheKey = engMode ? 'eng' : 'thai';
    if (provinceCache[cacheKey].length === 0) {
        const provinceSet = new Set<string>();
        (await db()).forEach((item) => provinceSet.add(item.province));
        provinceCache[cacheKey] = Array.from(provinceSet);
    }
    return provinceCache[cacheKey];
};

/**
 * Retrieves all unique districts for a given province.
 * If the district data for the specified province is not already cached, it will extract the districts from the database and store them in the cache.
 *
 * @param province - The name of the province for which to retrieve the districts.
 *
 * @returns A list of unique districts (strings) for the specified province.
 */
export const getDistrictByProvince = (province: string): Promise<string[]> =>
    cacheResult(districtCache, province, async () => {
        const districtSet = new Set<string>();
        (await db()).forEach((item) => {
            if (item.province === province) districtSet.add(item.district);
        });
        return districtSet;
    });

/**
 * Retrieves all unique sub-districts for a given district.
 * If the sub-district data for the specified district is not already cached, it will extract the sub-districts from the database and store them in the cache.
 *
 * @param district - The name of the district for which to retrieve the sub-districts.
 *
 * @returns A list of unique sub-districts (strings) for the specified district.
 */
export const getSubDistrictByDistrict = (district: string): Promise<string[]> =>
    cacheResult(subDistrictCache, district, async () => {
        const subDistrictSet = new Set<string>();
        (await db()).forEach((item) => {
            if (item.district === district)
                subDistrictSet.add(item.sub_district);
        });
        return subDistrictSet;
    });

/**
 * Retrieves all unique postal codes for a given sub-district.
 * If the postal code data for the specified sub-district is not already cached, it will extract the postal codes from the database and store them in the cache.
 *
 * @param sub_district - The name of the sub-district for which to retrieve the postal codes.
 *
 * @returns A list of unique postal codes (strings) for the specified sub-district.
 */
export const getPostalCodeByDistrict = (
    sub_district: string,
): Promise<string[]> =>
    cacheResult(PostalCodeCache, sub_district, async () => {
        const PostalCodeSet = new Set<string>();
        (await db()).forEach((item) => {
            if (item.sub_district === sub_district)
                PostalCodeSet.add(item.postal_code);
        });
        return PostalCodeSet;
    });

/**
 * Searches for addresses based on a specific field and search string.
 * This function queries the database for addresses matching the provided search string in the specified field.
 * Optionally, it limits the number of results to the specified maximum.
 *
 * @param field - The field of the address to search in (e.g., province, district, etc.).
 * @param searchStr - The search string or value to match in the specified field.
 * @param maxResult - An optional parameter that specifies the maximum number of results to return.
 *
 * @returns An array of addresses (IExpanded[]) that match the search criteria.
 */
const searchAddressByField = (
    field: keyof IExpanded,
    searchStr: string | number,
    maxResult?: number,
): Promise<IExpanded[]> => resolveResultbyField(field, searchStr, maxResult);

/**
 * Searches for addresses by sub-district based on the provided search string.
 * This function internally calls `searchAddressByField` with the 'sub_district' field and the given search string.
 * Optionally, it limits the number of results to the specified maximum.
 *
 * @param searchStr - The search string to match in the sub-district field.
 * @param maxResult - An optional parameter that specifies the maximum number of results to return.
 *
 * @returns An array of addresses (IExpanded[]) that match the search criteria in the sub-district field.
 */
export const searchAddressBySubDistrict = (
    searchStr: string,
    maxResult?: number,
): Promise<IExpanded[]> =>
    searchAddressByField('sub_district', searchStr, maxResult);

/**
 * Searches for addresses by district based on the provided search string.
 * This function internally calls `searchAddressByField` with the 'district' field and the given search string.
 * Optionally, it limits the number of results to the specified maximum.
 *
 * @param searchStr - The search string to match in the district field.
 * @param maxResult - An optional parameter that specifies the maximum number of results to return.
 *
 * @returns An array of addresses (IExpanded[]) that match the search criteria in the district field.
 */
export const searchAddressByDistrict = (
    searchStr: string,
    maxResult?: number,
): Promise<IExpanded[]> =>
    searchAddressByField('district', searchStr, maxResult);

/**
 * Searches for addresses by province based on the provided search string.
 * This function internally calls `searchAddressByField` with the 'province' field and the given search string.
 * Optionally, it limits the number of results to the specified maximum.
 *
 * @param searchStr - The search string to match in the province field.
 * @param maxResult - An optional parameter that specifies the maximum number of results to return.
 *
 * @returns An array of addresses (IExpanded[]) that match the search criteria in the province field.
 */
export const searchAddressByProvince = (
    searchStr: string,
    maxResult?: number,
): Promise<IExpanded[]> =>
    searchAddressByField('province', searchStr, maxResult);

/**
 * Searches for addresses by postal code based on the provided search string or number.
 * This function internally calls `searchAddressByField` with the 'PostalCode' field and the given search string or number.
 * Optionally, it limits the number of results to the specified maximum.
 *
 * @param searchStr - The search string or number to match in the postal code field.
 * @param maxResult - An optional parameter that specifies the maximum number of results to return.
 *
 * @returns An array of addresses (IExpanded[]) that match the search criteria in the postal code field.
 */
export const searchAddressByPostalCode = (
    searchStr: string | number,
    maxResult?: number,
): Promise<IExpanded[]> =>
    searchAddressByField('postal_code', searchStr, maxResult);

/**
 * Splits a full address string into its components and returns an expanded address object.
 * This function extracts the postal code from the full address, uses it to search for a matching address in the database,
 * and then returns a structured object containing the address components such as province, district, sub-district, and postal code.
 *
 * @param fullAddress - The full address string that needs to be split and parsed.
 *
 * @returns An `IExpanded` object with the address components, or null if no match is found.
 */
export const splitAddress = async (
    fullAddress: string,
): Promise<IExpanded | null> => {
    const regex = /\s(\d{5})(\s|$)/gi;
    const regexResult = regex.exec(fullAddress);
    if (!regexResult) return null;

    const postal_code = regexResult[1];
    const address = prepareAddress(fullAddress, postal_code);

    const searchResult: IExpandedWithPoint[] =
        await searchAddressByPostalCode(postal_code);

    const bestResult = getBestResult(searchResult, address);

    if (bestResult) {
        const newAddress = cleanupAddress(address, bestResult);
        return {
            address: newAddress,
            district: bestResult.district,
            sub_district: bestResult.sub_district,
            province: bestResult.province,
            postal_code: postal_code,
        } as IExpanded;
    }

    return null;
};

/**
 * Translates a word from English to Thai or vice versa.
 * It checks the first character of the word to determine if it is in English or Thai,
 * and then searches for the word in the appropriate word list (engWords or thaiWords).
 * If a match is found, it returns the corresponding translation from the opposite language list.
 * If no match is found, it returns the original word.
 *
 * @param word - The word to be translated.
 * @returns - The translated word if found, or the original word if no match is found.
 */
export const translateWord = async (word: string): Promise<string> => {
    if (word.length === 0) return '';

    let index = -1;
    const firstChar = word.charAt(0).toLowerCase();
    const checkEng = firstChar >= 'a' && firstChar <= 'z';
    if (!isThaiDBLoaded) await loadThaiDatabase();
    if (!isEngDBLoaded) await loadEngDatabase();

    if (checkEng) {
        const text = word.toLowerCase().trim();
        index = engWords.findIndex((item) =>
            item.toLowerCase().trim().includes(text),
        );
    } else {
        index = thaiWords.findIndex((item) => item.includes(word));
    }

    if (index === -1) return word;
    return checkEng ? thaiWords[index] : engWords[index];
};
