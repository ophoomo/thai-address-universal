import { IAddress } from '../types/address';
import { IDatabase } from '../types/database';

export class Address implements IAddress {
    private _cache = new Map<string, string[]>();
    private _lastDatabaseName: string | null = null;

    public constructor(private _database: IDatabase) {
        this._lastDatabaseName = this._database.name;
    }

    /**
     * Sets a new database instance.
     * @param database - The new database instance.
     */
    public setDatabase(database: IDatabase): void {
        this._database = database;
        // Clear cache when switching databases
        if (this._lastDatabaseName !== database.name) {
            this._cache.clear();
            this._lastDatabaseName = database.name;
        }
    }

    /**
     * Retrieves all unique provinces from the database.
     * Uses caching to avoid redundant database queries.
     * @returns An array of province names.
     */
    public getProvinceAll = (): string[] => {
        const cacheKey = `provinces_${this._database.name}`;
        if (!this._cache.has(cacheKey)) {
            const provinces = Array.from(
                new Set(this._database.getData().map((item) => item.province)),
            );
            this._cache.set(cacheKey, provinces);
        }
        return this._cache.get(cacheKey) || [];
    };

    /**
     * Retrieves districts for a given province.
     * Uses caching to avoid redundant database queries.
     * @param province - The province to filter districts by.
     * @returns An array of district names.
     */
    public getDistrictByProvince = (province: string): string[] => {
        const cacheKey = `districts_${this._database.name}_${province}`;
        if (!this._cache.has(cacheKey)) {
            const districts = Array.from(
                new Set(
                    this._database
                        .getData()
                        .filter((item) => item.province === province)
                        .map((item) => item.district),
                ),
            );
            this._cache.set(cacheKey, districts);
        }
        return this._cache.get(cacheKey) || [];
    };

    /**
     * Retrieves sub-districts for a given district.
     * Uses caching to avoid redundant database queries.
     * @param district - The district to filter sub-districts by.
     * @returns An array of sub-district names.
     */
    public getSubDistrictByDistrict = (district: string): string[] => {
        const cacheKey = `subdistricts_${this._database.name}_${district}`;
        if (!this._cache.has(cacheKey)) {
            const subDistricts = Array.from(
                new Set(
                    this._database
                        .getData()
                        .filter((item) => item.district === district)
                        .map((item) => item.sub_district),
                ),
            );
            this._cache.set(cacheKey, subDistricts);
        }
        return this._cache.get(cacheKey) || [];
    };

    /**
     * Retrieves postal codes for a given sub-district.
     * Uses caching to avoid redundant database queries.
     * @param sub_district - The sub-district to filter postal codes by.
     * @returns An array of postal codes.
     */
    public getPostalCodeBySubDistrict = (sub_district: string): string[] => {
        const cacheKey = `postalcodes_${this._database.name}_${sub_district}`;
        if (!this._cache.has(cacheKey)) {
            const postalCodes = Array.from(
                new Set(
                    this._database
                        .getData()
                        .filter((item) => item.sub_district === sub_district)
                        .map((item) => item.postal_code),
                ),
            );
            this._cache.set(cacheKey, postalCodes);
        }
        return this._cache.get(cacheKey) || [];
    };
}
