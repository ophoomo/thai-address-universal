import { IDatabase } from '../types/database';
import { IExpanded, IExpandedWithPoint } from '../types/thai-address';
import { ISearch } from '../types/search';
import {
    cleanupAddress,
    getBestResult,
    prepareAddress,
} from '../utils/split-address';

export class SearchRepository implements ISearch {
    private _searchCache = new Map<string, IExpanded[]>();
    private _lastDatabaseName: string | null = null;

    public constructor(private _database: IDatabase) {
        this._lastDatabaseName = this._database.name;
    }

    /**
     * Updates the database instance used for searching.
     * @param database - The new database instance.
     */
    public setDatabase(database: IDatabase): void {
        this._database = database;
        // Clear cache when switching databases
        if (this._lastDatabaseName !== database.name) {
            this._searchCache.clear();
            this._lastDatabaseName = database.name;
        }
    }

    /**
     * Searches for addresses by province.
     * @param searchStr - The search string for the province.
     * @param maxResult - Optional limit on the number of results.
     * @returns An array of matching address data.
     */
    public searchAddressByProvince(
        searchStr: string,
        maxResult?: number,
    ): IExpanded[] {
        return this.searchAddressByField('province', searchStr, maxResult);
    }

    /**
     * Searches for addresses by district.
     * @param searchStr - The search string for the district.
     * @param maxResult - Optional limit on the number of results.
     * @returns An array of matching address data.
     */
    public searchAddressByDistrict(
        searchStr: string,
        maxResult?: number,
    ): IExpanded[] {
        return this.searchAddressByField('district', searchStr, maxResult);
    }

    /**
     * Searches for addresses by sub-district.
     * @param searchStr - The search string for the sub-district.
     * @param maxResult - Optional limit on the number of results.
     * @returns An array of matching address data.
     */
    public searchAddressBySubDistrict(
        searchStr: string | number,
        maxResult?: number,
    ): IExpanded[] {
        return this.searchAddressByField('sub_district', searchStr, maxResult);
    }

    /**
     * Searches for addresses by postal code.
     * @param searchStr - The search string for the postal code.
     * @param maxResult - Optional limit on the number of results.
     * @returns An array of matching address data.
     */
    public searchAddressByPostalCode(
        searchStr: string | number,
        maxResult?: number,
    ): IExpanded[] {
        return this.searchAddressByField('postal_code', searchStr, maxResult);
    }

    /**
     * Splits a full address string into its components (province, district, sub-district, postal code).
     * @param fullAddress - The full address string to split.
     * @returns An object containing the address components, or null if parsing fails.
     */
    public splitAddress(fullAddress: string): IExpanded | null {
        // Use regex to extract the postal code from the full address
        const regex = /\s(\d{5})(\s|$)/gi;
        const regexResult = regex.exec(fullAddress);
        if (!regexResult) return null;

        const postal_code = regexResult[1];
        // Prepare the address by removing the postal code and cleaning up the string
        const address = prepareAddress(fullAddress, postal_code);

        // Search for addresses matching the extracted postal code
        const searchResult: IExpandedWithPoint[] =
            this.searchAddressByPostalCode(postal_code);

        // Find the best matching address from the search results
        const bestResult = getBestResult(searchResult, address);

        if (bestResult) {
            // Clean up the address string based on the best match
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
    }

    /**
     * Helper method to search for addresses by a specific field (e.g., province, district).
     * @param field - The field to search by.
     * @param searchStr - The search string.
     * @param maxResult - Optional limit on the number of results.
     * @returns An array of matching address data.
     */
    private searchAddressByField(
        field: keyof IExpanded,
        searchStr: string | number,
        maxResult?: number,
    ): IExpanded[] {
        return this.resolveResultbyField(field, searchStr, maxResult);
    }

    /**
     * Filters and resolves address data based on a specific field and search string.
     * @param type - The field to filter by (e.g., province, district).
     * @param searchStr - The search string.
     * @param maxResult - Optional limit on the number of results (default: 20).
     * @returns An array of matching address data.
     */
    public resolveResultbyField(
        type: keyof IExpanded,
        searchStr: string | number,
        maxResult: number = 20,
    ): IExpanded[] {
        // Normalize the search string
        const normalizedSearch = searchStr.toString().trim().toLowerCase();
        if (normalizedSearch === '') return [];

        // Create cache key with field and search parameters
        const cacheKey = `${type}_${normalizedSearch}_${maxResult}_${this._database.name}`;

        if (this._searchCache.has(cacheKey)) {
            return this._searchCache.get(cacheKey) || [];
        }

        try {
            // Filter and limit results in a single pass
            const results = this._database
                .getData()
                .filter((item) =>
                    (item[type] || '')
                        .toString()
                        .trim()
                        .toLowerCase()
                        .includes(normalizedSearch),
                )
                .slice(0, maxResult);

            // Cache the results
            this._searchCache.set(cacheKey, results);
            return results;
        } catch (e) {
            console.error('Error during filtering:', e);
            return [];
        }
    }
}
