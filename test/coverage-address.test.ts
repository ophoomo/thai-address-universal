import { Address } from '../src/core/address';
import { IDatabase } from '../src/types/database';

describe('Address - Cache get fallback coverage', () => {
    let address: Address;
    let mockDatabase: IDatabase;

    beforeEach(() => {
        mockDatabase = {
            name: 'thai',
            getData: jest.fn(() => []),
            getWord: jest.fn(() => []),
            getGeo: jest.fn(() => undefined),
            load: jest.fn(),
            setGeo: jest.fn(),
        } as unknown as IDatabase;

        address = new Address(mockDatabase);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('Cache get fallback - || []', () => {
        it('should handle cache.get() returning undefined and return empty array', () => {
            // Manually set a cache entry to undefined (edge case)
            const cache = (
                address as unknown as Record<string, Map<string, string[]>>
            )._cache;
            cache.set('provinces_thai', []);

            // Clear the cache to simulate a scenario where get returns undefined
            cache.delete('provinces_thai');

            const results = address.getProvinceAll();
            expect(results).toEqual([]);
        });

        it('should handle getDistrictByProvince cache miss with empty database', () => {
            const results = address.getDistrictByProvince('NonExistent');
            expect(results).toEqual([]);

            // Second call should return cached empty array
            const cache = (
                address as unknown as Record<string, Map<string, string[]>>
            )._cache;
            expect(cache.get('districts_thai_NonExistent')).toEqual([]);
        });

        it('should handle getSubDistrictByDistrict cache miss with empty database', () => {
            const results = address.getSubDistrictByDistrict('NonExistent');
            expect(results).toEqual([]);

            const cache = (
                address as unknown as Record<string, Map<string, string[]>>
            )._cache;
            expect(cache.get('subdistricts_thai_NonExistent')).toEqual([]);
        });

        it('should handle getPostalCodeBySubDistrict cache miss with empty database', () => {
            const results = address.getPostalCodeBySubDistrict('NonExistent');
            expect(results).toEqual([]);

            const cache = (
                address as unknown as Record<string, Map<string, string[]>>
            )._cache;
            expect(cache.get('postalcodes_thai_NonExistent')).toEqual([]);
        });

        it('should return [] when cache entry exists but value is undefined (provinces)', () => {
            const cache = (
                address as unknown as Record<string, Map<string, string[]>>
            )._cache;
            // create a key with explicit undefined value
            (cache as unknown as Map<string, string[] | undefined>).set(
                'provinces_thai',
                undefined,
            );

            const res = address.getProvinceAll();
            expect(res).toEqual([]);
        });

        it('should return [] when cache entry exists but value is undefined (districts)', () => {
            const cache = (
                address as unknown as Record<string, Map<string, string[]>>
            )._cache;
            (cache as unknown as Map<string, string[] | undefined>).set(
                'districts_thai_Empty',
                undefined,
            );

            const res = address.getDistrictByProvince('Empty');
            expect(res).toEqual([]);
        });

        it('should return [] when cache entry exists but value is undefined (subdistricts)', () => {
            const cache = (
                address as unknown as Record<string, Map<string, string[]>>
            )._cache;
            (cache as unknown as Map<string, string[] | undefined>).set(
                'subdistricts_thai_Empty',
                undefined,
            );

            const res = address.getSubDistrictByDistrict('Empty');
            expect(res).toEqual([]);
        });

        it('should return [] when cache entry exists but value is undefined (postalcodes)', () => {
            const cache = (
                address as unknown as Record<string, Map<string, string[]>>
            )._cache;
            (cache as unknown as Map<string, string[] | undefined>).set(
                'postalcodes_thai_Empty',
                undefined,
            );

            const res = address.getPostalCodeBySubDistrict('Empty');
            expect(res).toEqual([]);
        });
    });
});
