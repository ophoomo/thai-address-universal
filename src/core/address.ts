import { IAddress } from '../types/address';
import { IDatabase } from '../types/database';

export class Address implements IAddress {
    private _cache = new Map<string, string[]>();

    public constructor(private _database: IDatabase) {}

    /**
     * Sets a new database instance.
     * @param database - The new database instance.
     */
    public setDatabase(database: IDatabase): void {
        this._database = database;
    }

    /**
     * Retrieves all unique provinces from the database.
     * Uses caching to avoid redundant database queries.
     * @returns An array of province names.
     */
    public getProvinceAll = (): string[] => {
        const key = this._database.name;
        if (!this._cache.has(key)) {
            const provinceSet = new Set<string>();
            this._database
                .getData()
                .forEach((item) => provinceSet.add(item.province));
            this._cache.set(key, Array.from(provinceSet));
        }
        return this._cache.get(key) || [];
    };

    /**
     * Retrieves districts for a given province.
     * Uses caching to avoid redundant database queries.
     * @param province - The province to filter districts by.
     * @returns An array of district names.
     */
    public getDistrictByProvince = (province: string): string[] =>
        this.cacheResult(province, () => {
            const districtSet = new Set<string>();
            this._database.getData().forEach((item) => {
                if (item.province === province) districtSet.add(item.district);
            });
            return districtSet;
        });

    /**
     * Retrieves sub-districts for a given district.
     * Uses caching to avoid redundant database queries.
     * @param district - The district to filter sub-districts by.
     * @returns An array of sub-district names.
     */
    public getSubDistrictByDistrict = (district: string): string[] =>
        this.cacheResult(district, () => {
            const subDistrictSet = new Set<string>();
            this._database.getData().forEach((item) => {
                if (item.district === district)
                    subDistrictSet.add(item.sub_district);
            });
            return subDistrictSet;
        });

    /**
     * Retrieves postal codes for a given sub-district.
     * Uses caching to avoid redundant database queries.
     * @param sub_district - The sub-district to filter postal codes by.
     * @returns An array of postal codes.
     */
    public getPostalCodeBySubDistrict = (sub_district: string): string[] =>
        this.cacheResult(sub_district, () => {
            const PostalCodeSet = new Set<string>();
            this._database.getData().forEach((item) => {
                if (item.sub_district === sub_district)
                    PostalCodeSet.add(item.postal_code);
            });
            return PostalCodeSet;
        });

    /**
     * Helper method to cache results of database queries.
     * @param key - The cache key (e.g., province, district, sub-district).
     * @param fetchFunc - A function to fetch data if not already cached.
     * @returns An array of results from the cache or the database.
     */
    private cacheResult = (
        key: string,
        fetchFunc: () => Set<string>,
    ): string[] => {
        if (!this._cache.has(key)) {
            this._cache.set(key, Array.from(fetchFunc()));
        }
        return this._cache.get(key) || [];
    };
}
