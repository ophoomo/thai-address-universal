import type { IAddress } from '../types/address';
import type { IDatabase } from '../types/database';
import type { IExpanded } from '../types/thai-address';

/** Picks the value one query is interested in out of a row. */
type FieldSelector = (row: IExpanded) => string;

/** Narrows the dataset to the children of one parent. */
type RowPredicate = (row: IExpanded) => boolean;

/**
 * Returns the distinct values at a single administrative level, memoising each
 * distinct list until {@link Address.setDatabase} swaps in a different dataset.
 *
 * The four public getters are thin wrappers around {@link Address.distinct}; the
 * only things that vary between them are the cache key, the field they read and
 * the (optional) parent filter.
 */
export class Address implements IAddress {
    private cache = new Map<string, string[]>();
    private cachedFor: string;

    public constructor(private database: IDatabase) {
        this.cachedFor = database.name;
    }

    public setDatabase(database: IDatabase): void {
        this.database = database;
        if (this.cachedFor !== database.name) {
            this.cache.clear();
            this.cachedFor = database.name;
        }
    }

    public getProvinceAll = (): string[] =>
        this.distinct(this.cacheKey('province'), (row) => row.province);

    public getDistrictByProvince = (province: string): string[] =>
        this.distinct(
            this.cacheKey('district', province),
            (row) => row.district,
            (row) => row.province === province,
        );

    public getSubDistrictByDistrict = (district: string): string[] =>
        this.distinct(
            this.cacheKey('subDistrict', district),
            (row) => row.sub_district,
            (row) => row.district === district,
        );

    public getPostalCodeBySubDistrict = (subDistrict: string): string[] =>
        this.distinct(
            this.cacheKey('postalCode', subDistrict),
            (row) => row.postal_code,
            (row) => row.sub_district === subDistrict,
        );

    /** Builds a cache key that is unique per dataset, level and parent value. */
    private cacheKey(level: string, parent = ''): string {
        return `${level}:${this.database.name}:${parent}`;
    }

    private distinct(
        cacheKey: string,
        select: FieldSelector,
        where?: RowPredicate,
    ): string[] {
        const cached = this.cache.get(cacheKey);
        if (cached) {
            return cached;
        }
        const rows = where
            ? this.database.getData().filter(where)
            : this.database.getData();
        const values = [...new Set(rows.map(select))];
        this.cache.set(cacheKey, values);
        return values;
    }
}
