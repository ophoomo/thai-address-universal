import type { IDatabase } from './database';

/**
 * Read model over a {@link IDatabase}: returns the distinct values at one
 * administrative level, optionally narrowed by its parent. Every result is
 * memoised until the backing database changes.
 */
export interface IAddress {
    /** Points the repository at a new dataset and clears the cache if it differs. */
    setDatabase(database: IDatabase): void;

    /** Every province name. */
    getProvinceAll(): string[];

    /** District names within `province`. */
    getDistrictByProvince(province: string): string[];

    /** Sub-district names within `district`. */
    getSubDistrictByDistrict(district: string): string[];

    /** Postal codes used by `subDistrict`. */
    getPostalCodeBySubDistrict(subDistrict: string): string[];
}
