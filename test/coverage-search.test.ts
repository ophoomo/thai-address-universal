import { SearchRepository } from '../src/core/search';
import { IDatabase } from '../src/types/database';
import { IExpanded } from '../src/types/thai-address.d';

describe('SearchRepository - Error handling coverage', () => {
    let searchRepository: SearchRepository;
    let mockDatabase: IDatabase;

    beforeEach(() => {
        mockDatabase = {
            name: 'thai',
            getData: jest.fn(() => [
                {
                    province: 'Bangkok',
                    district: 'Pathum Wan',
                    sub_district: 'Lumphini',
                    postal_code: '10330',
                },
            ]),
            getWord: jest.fn(() => []),
            getGeo: jest.fn(() => undefined),
            load: jest.fn(),
            setGeo: jest.fn(),
        } as unknown as IDatabase;

        searchRepository = new SearchRepository(mockDatabase);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('resolveResultbyField - error handler', () => {
        it('should catch filter errors and return empty array', () => {
            jest.spyOn(console, 'error').mockImplementation(() => {});

            // Mock getData to throw error during filter
            jest.spyOn(mockDatabase, 'getData').mockImplementation(() => {
                throw new Error('Database connection error');
            });

            const results = searchRepository['resolveResultbyField'](
                'province',
                'Bangkok',
            );

            expect(results).toEqual([]);
            expect(console.error).toHaveBeenCalledWith(
                'Error during filtering:',
                expect.any(Error),
            );
        });

        it('should handle errors from filter operation', () => {
            jest.spyOn(console, 'error').mockImplementation(() => {});

            // Mock getData to return object that will fail on filter
            jest.spyOn(mockDatabase, 'getData').mockImplementation(() => {
                return [
                    // Missing required properties to cause filter error
                    { province: 'Bangkok' },
                ] as unknown as IExpanded[];
            });

            const results = searchRepository['resolveResultbyField'](
                'district',
                'Pathum',
            );

            // Should still work with partial data, but test error path
            expect(Array.isArray(results)).toBe(true);
        });

        it('should catch toString() errors on filtered items', () => {
            jest.spyOn(console, 'error').mockImplementation(() => {});

            // Create object with problematic toString method
            const badData = [
                {
                    province: 'Bangkok',
                    district: {
                        toString() {
                            throw new Error('toString failed');
                        },
                    },
                    sub_district: 'Lumphini',
                    postal_code: '10330',
                },
            ];

            jest.spyOn(mockDatabase, 'getData').mockReturnValue(
                badData as unknown as IExpanded[],
            );

            const results = searchRepository['resolveResultbyField'](
                'district',
                'Test',
            );

            expect(results).toEqual([]);
            expect(console.error).toHaveBeenCalledWith(
                'Error during filtering:',
                expect.any(Error),
            );
        });
    });

    describe('Cache get fallback coverage', () => {
        it('should return empty array from cache.get() fallback', () => {
            // Set cache to empty result
            searchRepository['resolveResultbyField']('province', 'NonExistent');

            // Second call should use cache and test || [] fallback
            const results = searchRepository['resolveResultbyField'](
                'province',
                'NonExistent',
            );

            expect(results).toEqual([]);
        });

        it('should return [] when cache entry exists but value is undefined', () => {
            const cache = (
                searchRepository as unknown as Record<
                    string,
                    Map<string, unknown>
                >
            )._searchCache;
            // insert key with explicit undefined value to hit `|| []` fallback
            (cache as unknown as Map<string, unknown | undefined>).set(
                'province_nonexistent_20_thai',
                undefined,
            );

            const results = searchRepository['resolveResultbyField'](
                'province',
                'nonexistent',
            );
            expect(results).toEqual([]);
        });
    });
});
