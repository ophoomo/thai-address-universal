import { DEFAULT_SEARCH_LIMIT, POSTAL_CODE_PATTERN } from '../constants';
import type { IDatabase } from '../types/database';
import type { ISearch } from '../types/search';
import type { IExpanded, IExpandedWithPoint } from '../types/thai-address';
import {
    cleanupAddress,
    getBestResult,
    prepareAddress,
} from '../utils/split-address';

/** Effectively "no limit" for the internal postal-code lookup in `splitAddress`. */
const UNBOUNDED = Number.MAX_SAFE_INTEGER;

/**
 * Substring search over the dataset, plus the `splitAddress` parser. Every
 * distinct `(field, query, limit)` result is memoised until the backing
 * database changes.
 */
export class SearchRepository implements ISearch {
    private cache = new Map<string, IExpanded[]>();
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

    public searchAddressByProvince(query: string, limit?: number): IExpanded[] {
        return this.resolveResultbyField('province', query, limit);
    }

    public searchAddressByDistrict(query: string, limit?: number): IExpanded[] {
        return this.resolveResultbyField('district', query, limit);
    }

    public searchAddressBySubDistrict(
        query: string | number,
        limit?: number,
    ): IExpanded[] {
        return this.resolveResultbyField('sub_district', query, limit);
    }

    public searchAddressByPostalCode(
        query: string | number,
        limit?: number,
    ): IExpanded[] {
        return this.resolveResultbyField('postal_code', query, limit);
    }

    /**
     * Splits a free-text address into its components.
     *
     * The postal code is the anchor: it is extracted first, every row that
     * uses it is fetched, and {@link getBestResult} picks the row whose
     * province / district / sub-district best explain the rest of the text.
     *
     * @returns The components plus the unmatched `address` remainder, or `null`
     *          when no postal code is found or no row corroborates it.
     */
    public splitAddress(fullAddress: string): IExpanded | null {
        const postalMatch = fullAddress.match(POSTAL_CODE_PATTERN);
        if (!postalMatch) {
            return null;
        }
        const postalCode = postalMatch[1];

        const remainder = prepareAddress(fullAddress, postalCode);
        // No limit here: a postal code can span more than DEFAULT_SEARCH_LIMIT
        // sub-districts, and the real match must not be truncated away.
        const candidates = this.searchAddressByPostalCode(
            postalCode,
            UNBOUNDED,
        ) as IExpandedWithPoint[];

        const best = getBestResult(candidates, remainder);
        if (!best) {
            return null;
        }

        return {
            address: cleanupAddress(remainder, best),
            district: best.district,
            sub_district: best.sub_district,
            province: best.province,
            postal_code: postalCode,
        };
    }

    /**
     * Case-insensitive substring match of `query` against one field.
     *
     * @param field - Column to match on.
     * @param query - Needle; numbers are stringified, blank queries return `[]`.
     * @param limit - Maximum rows to return; defaults to {@link DEFAULT_SEARCH_LIMIT}.
     */
    public resolveResultbyField(
        field: keyof IExpanded,
        query: string | number,
        limit: number = DEFAULT_SEARCH_LIMIT,
    ): IExpanded[] {
        const needle = query.toString().trim().toLowerCase();
        if (needle === '') {
            return [];
        }

        const cacheKey = `${field}:${needle}:${limit}:${this.database.name}`;
        const cached = this.cache.get(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            const matches = this.database
                .getData()
                .filter((row) =>
                    (row[field] ?? '')
                        .toString()
                        .trim()
                        .toLowerCase()
                        .includes(needle),
                )
                .slice(0, limit);
            this.cache.set(cacheKey, matches);
            return matches;
        } catch (error) {
            console.error('Error during filtering:', error);
            return [];
        }
    }
}
