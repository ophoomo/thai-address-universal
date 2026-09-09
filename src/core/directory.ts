import { GEOCODE_LENGTH } from '../constants';
import type { IExpanded } from '../types/thai-address';
import { EngDatabase, ThaiDatabase } from './database';
import { Geo } from './geo';

/**
 * One administrative unit, with its name in both languages and its official
 * geocode. Unlike {@link IExpanded} (kept in the historical snake_case), this
 * newer structured API uses camelCase.
 */
export interface AddressEntry {
    /** Thai name. */
    nameTh: string;
    /** Romanised name. */
    nameEn: string;
    /** Standard geocode: 2 digits for a province, 4 for a district, 6 for a sub-district. */
    code: string;
    /** Postal code — present on sub-district entries only. */
    postalCode?: string;
}

/** An {@link IExpanded} row that is guaranteed to carry its geocodes. */
type GeoRow = IExpanded &
    Required<
        Pick<IExpanded, 'province_code' | 'district_code' | 'sub_district_code'>
    >;

/** A Thai row and its English counterpart (same place, same index). */
interface RowPair {
    th: GeoRow;
    en: GeoRow;
}

let cached: Promise<RowPair[]> | null = null;

/**
 * Builds the Thai/English row pairs once. A throwaway pair of databases is
 * decoded with the geo overlay so the pairs are independent of the global
 * `setEngMode` / `setGeoMode` state.
 */
const buildRowPairs = async (): Promise<RowPair[]> => {
    const geo = new Geo();
    await geo.load();

    const thai = new ThaiDatabase();
    const english = new EngDatabase();
    await Promise.all([thai.setGeo(geo), english.setGeo(geo)]);

    // Safe cast: geo mode was just enabled on both instances above.
    const th = thai.getData() as GeoRow[];
    const en = english.getData() as GeoRow[];
    return th.map((row, index) => ({ th: row, en: en[index] }));
};

const loadRowPairs = (): Promise<RowPair[]> => {
    cached ??= buildRowPairs();
    return cached;
};

/** Discards the cached row pairs (used by tests). */
export const resetDirectoryCache = (): void => {
    cached = null;
};

/** Level of the administrative hierarchy a query targets. */
type Level = 'province' | 'district';

const CODE_FIELD = {
    province: 'province_code',
    district: 'district_code',
} as const satisfies Record<Level, keyof IExpanded>;

/** Does `pair` sit under `query` (Thai name, English name, or exact code)? */
const isUnder = (pair: RowPair, level: Level, query: string): boolean =>
    pair.th[level].toLowerCase() === query ||
    pair.en[level].toLowerCase() === query ||
    pair.th[CODE_FIELD[level]] === query;

/** One {@link AddressEntry} per distinct name at `level`, first code wins. */
const uniqueByName = (pairs: RowPair[], level: Level): AddressEntry[] => {
    const seen = new Set<string>();
    const entries: AddressEntry[] = [];
    for (const { th, en } of pairs) {
        if (seen.has(th[level])) {
            continue;
        }
        seen.add(th[level]);
        entries.push({
            nameTh: th[level],
            nameEn: en[level],
            code: th[CODE_FIELD[level]],
        });
    }
    return entries;
};

/** Every province, in both languages, with its 2-digit code. */
export const getProvinces = async (): Promise<AddressEntry[]> =>
    uniqueByName(await loadRowPairs(), 'province');

/**
 * Districts of one province.
 *
 * @param province - The province's Thai name, English name, or 2-digit code.
 */
export const getDistricts = async (
    province: string,
): Promise<AddressEntry[]> => {
    const query = province.trim().toLowerCase();
    const pairs = (await loadRowPairs()).filter((pair) =>
        isUnder(pair, 'province', query),
    );
    return uniqueByName(pairs, 'district');
};

/**
 * Sub-districts of one district, each with its postal code.
 *
 * @param district - The district's Thai name, English name, or 4-digit code.
 */
export const getSubDistricts = async (
    district: string,
): Promise<AddressEntry[]> => {
    const query = district.trim().toLowerCase();
    return (await loadRowPairs())
        .filter((pair) => isUnder(pair, 'district', query))
        .map(({ th, en }) => ({
            nameTh: th.sub_district,
            nameEn: en.sub_district,
            code: th.sub_district_code,
            postalCode: th.postal_code,
        }));
};

/**
 * Looks up a single unit by its exact geocode. The length of `code` selects
 * the level: {@link GEOCODE_LENGTH.PROVINCE}, `.DISTRICT` or `.SUB_DISTRICT`.
 * Returns `null` for an unknown code or an unrecognised length.
 */
export const getByGeocode = async (
    code: string,
): Promise<AddressEntry | null> => {
    const trimmed = code.trim();
    const { PROVINCE, DISTRICT, SUB_DISTRICT } = GEOCODE_LENGTH;

    if (trimmed.length === PROVINCE) {
        const provinces = await getProvinces();
        return provinces.find((entry) => entry.code === trimmed) ?? null;
    }
    if (trimmed.length === DISTRICT) {
        const districts = await getDistricts(trimmed.slice(0, PROVINCE));
        return districts.find((entry) => entry.code === trimmed) ?? null;
    }
    if (trimmed.length === SUB_DISTRICT) {
        const subDistricts = await getSubDistricts(trimmed.slice(0, DISTRICT));
        return subDistricts.find((entry) => entry.code === trimmed) ?? null;
    }
    return null;
};
