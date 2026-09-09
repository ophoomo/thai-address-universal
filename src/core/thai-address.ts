import { LANGUAGE, type Language } from '../constants';
import type { IAddress } from '../types/address';
import type { IDatabase } from '../types/database';
import type { ISearch } from '../types/search';
import type { IExpanded } from '../types/thai-address';
import type { ITranslate } from '../types/translate';
import { getDefaultLanguage } from '../utils/helper';
import { Address } from './address';
import { DatabaseFactory } from './database';
import { Geo } from './geo';
import { SearchRepository } from './search';
import { Translate } from './translate';

/**
 * Process-wide singletons. They are created on first use by
 * {@link ensureInitialised} and re-pointed (not re-created) when the language
 * changes, so callers never have to await an explicit setup step.
 */
let database: IDatabase;
let search: ISearch;
let address: IAddress;
let translate: ITranslate;

/** Builds the singletons for the host's default language. */
const initialise = async (): Promise<void> => {
    database = await DatabaseFactory.createDatabase(getDefaultLanguage());
    search = new SearchRepository(database);
    address = new Address(database);
    translate = new Translate();
};

/** Guarantees the singletons exist before a lookup touches them. */
const ensureInitialised = async (): Promise<void> => {
    if (!database) {
        await initialise();
    }
};

/** Every decoded sub-district row of the active dataset. */
export const getDatabase = (): IExpanded[] => database.getData();

/** Whether the geocode overlay is currently attached. */
export const getGeoMode = (): boolean => database.getGeo() !== undefined;

/**
 * Attaches or detaches the geocode overlay. While on, every row also carries
 * `province_code` / `district_code` / `sub_district_code`.
 */
export const setGeoMode = async (enabled: boolean): Promise<void> => {
    if (!enabled) {
        DatabaseFactory.clearGeo();
        return;
    }
    const geo = new Geo();
    await geo.load();
    DatabaseFactory.createGeo(geo);
};

/** Whether the active dataset is the English one. */
export const getEngMode = (): boolean => database.name === LANGUAGE.ENGLISH;

/** Switches the active dataset between English and Thai. */
export const setEngMode = async (enabled: boolean): Promise<void> => {
    await ensureInitialised();
    database = await DatabaseFactory.createDatabase(
        enabled ? LANGUAGE.ENGLISH : LANGUAGE.THAI,
    );
    search.setDatabase(database);
    address.setDatabase(database);
};

/** All province names. */
export const getProvinceAll = async (): Promise<string[]> => {
    await ensureInitialised();
    return address.getProvinceAll();
};

/** District names within `province` (empty array if it is unknown). */
export const getDistrictByProvince = async (
    province: string,
): Promise<string[]> => {
    await ensureInitialised();
    return address.getDistrictByProvince(province);
};

/** Sub-district names within `district` (empty array if it is unknown). */
export const getSubDistrictByDistrict = async (
    district: string,
): Promise<string[]> => {
    await ensureInitialised();
    return address.getSubDistrictByDistrict(district);
};

/** Postal codes used by `subDistrict` (empty array if it is unknown). */
export const getPostalCodeBySubDistrict = async (
    subDistrict: string,
): Promise<string[]> => {
    await ensureInitialised();
    return address.getPostalCodeBySubDistrict(subDistrict);
};

/** Rows whose province contains `query` (case-insensitive substring). */
export const searchAddressByProvince = async (
    query: string,
    limit?: number,
): Promise<IExpanded[]> => {
    await ensureInitialised();
    return search.searchAddressByProvince(query, limit);
};

/** Rows whose district contains `query` (case-insensitive substring). */
export const searchAddressByDistrict = async (
    query: string,
    limit?: number,
): Promise<IExpanded[]> => {
    await ensureInitialised();
    return search.searchAddressByDistrict(query, limit);
};

/** Rows whose sub-district contains `query` (case-insensitive substring). */
export const searchAddressBySubDistrict = async (
    query: string,
    limit?: number,
): Promise<IExpanded[]> => {
    await ensureInitialised();
    return search.searchAddressBySubDistrict(query, limit);
};

/** Rows whose postal code contains `query` (accepts a number). */
export const searchAddressByPostalCode = async (
    query: string | number,
    limit?: number,
): Promise<IExpanded[]> => {
    await ensureInitialised();
    return search.searchAddressByPostalCode(query, limit);
};

/**
 * Splits a free-text address into `{ province, district, sub_district,
 * postal_code, address }`, or `null` when it cannot be resolved confidently.
 */
export const splitAddress = async (
    fullAddress: string,
): Promise<IExpanded | null> => {
    await ensureInitialised();
    return search.splitAddress(fullAddress);
};

/**
 * Translates a single place name between Thai and English, returning the input
 * unchanged when it has no counterpart.
 */
export const translateWord = async (text: string): Promise<string> => {
    await ensureInitialised();
    return translate.translateWord(text);
};

/** Options for {@link preload}. */
export interface PreloadOptions {
    /**
     * Which dataset(s) to fetch: `'thai'`, `'eng'`, or `'both'`. Defaults to
     * the host's default language.
     */
    language?: Language | 'both';
    /** Also fetch the geocode chunk (without turning geo mode on). */
    geo?: boolean;
}

/**
 * Fetches the data chunks ahead of time so the first real lookup does not have
 * to wait on the network. Purely a warm-up: it never changes the active
 * language or geo mode.
 *
 * @example
 * // e.g. when an address form mounts
 * void preload({ language: 'both', geo: true });
 */
export const preload = async (options: PreloadOptions = {}): Promise<void> => {
    const { language = getDefaultLanguage(), geo = false } = options;
    const languages =
        language === 'both' ? [LANGUAGE.THAI, LANGUAGE.ENGLISH] : [language];

    await Promise.all([
        ensureInitialised(),
        ...languages.map((lang) => DatabaseFactory.createDatabase(lang)),
        geo ? new Geo().load() : Promise.resolve(),
    ]);
};
