import { SearchRepository } from '../src/core/search';
import { IDatabase } from '../src/types/database';

describe('SearchRepository - Cache and Error Handling', () => {
    let searchRepository: SearchRepository;
    let mockDatabase: IDatabase;

    const mockData = [
        {
            province: 'Bangkok',
            district: 'Pathum Wan',
            sub_district: 'Lumphini',
            postal_code: '10330',
        },
        {
            province: 'Bangkok',
            district: 'Sathon',
            sub_district: 'Thung Maha Mek',
            postal_code: '10120',
        },
        {
            province: 'Chiang Mai',
            district: 'Mueang Chiang Mai',
            sub_district: 'Si Phum',
            postal_code: '50200',
        },
    ];

    beforeEach(() => {
        mockDatabase = {
            name: 'thai',
            getData: jest.fn(() => mockData),
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

    describe('resolveResultbyField - Caching', () => {
        it('should cache search results and return cached data on second call', () => {
            mockDatabase.name = 'thai';
            const getDataSpy = jest.spyOn(mockDatabase, 'getData');

            searchRepository['resolveResultbyField']('province', 'Bangkok');
            getDataSpy.mockClear();

            // Second call should use cache
            searchRepository['resolveResultbyField']('province', 'Bangkok');

            expect(getDataSpy).not.toHaveBeenCalled();
        });

        it('should clear cache when database is switched', () => {
            mockDatabase.name = 'thai';
            searchRepository['resolveResultbyField']('province', 'Bangkok');

            // Switch database
            const newMockDatabase = {
                name: 'eng',
                getData: jest.fn(() => mockData),
                getWord: jest.fn(() => []),
                getGeo: jest.fn(() => undefined),
                load: jest.fn(),
                setGeo: jest.fn(),
            } as unknown as IDatabase;

            searchRepository.setDatabase(newMockDatabase);
            const getDataSpy = jest.spyOn(newMockDatabase, 'getData');

            // Should fetch from new database, not use old cache
            searchRepository['resolveResultbyField']('province', 'Bangkok');

            expect(getDataSpy).toHaveBeenCalled();
        });

        it('should have different cache keys for different maxResult values', () => {
            mockDatabase.name = 'thai';
            const getDataSpy = jest.spyOn(mockDatabase, 'getData');

            searchRepository['resolveResultbyField']('province', 'Bangkok', 1);
            getDataSpy.mockClear();

            // Different maxResult should not use cache
            searchRepository['resolveResultbyField']('province', 'Bangkok', 2);

            expect(getDataSpy).toHaveBeenCalled();
        });
    });

    describe('setDatabase - cache clearing on language switch', () => {
        it('should clear cache when switching to different language', () => {
            mockDatabase.name = 'thai';
            searchRepository['resolveResultbyField']('province', 'Bangkok');

            const newMockDatabase = {
                name: 'eng',
                getData: jest.fn(() => mockData),
                getWord: jest.fn(() => []),
                getGeo: jest.fn(() => undefined),
                load: jest.fn(),
                setGeo: jest.fn(),
            } as unknown as IDatabase;

            searchRepository.setDatabase(newMockDatabase);
            const getDataSpy = jest.spyOn(newMockDatabase, 'getData');

            // Query with same parameters should not use cache
            searchRepository['resolveResultbyField']('province', 'Bangkok');

            expect(getDataSpy).toHaveBeenCalled();
        });

        it('should not clear cache when switching to same language', () => {
            mockDatabase.name = 'thai';
            searchRepository['resolveResultbyField']('province', 'Bangkok');

            const sameMockDatabase = {
                name: 'thai',
                getData: jest.fn(() => mockData),
                getWord: jest.fn(() => []),
                getGeo: jest.fn(() => undefined),
                load: jest.fn(),
                setGeo: jest.fn(),
            } as unknown as IDatabase;

            searchRepository.setDatabase(sameMockDatabase);
            const getDataSpy = jest.spyOn(sameMockDatabase, 'getData');

            // Should use cache
            searchRepository['resolveResultbyField']('province', 'Bangkok');

            expect(getDataSpy).not.toHaveBeenCalled();
        });
    });

    describe('Error Handling', () => {
        it('should handle errors gracefully and return empty array', () => {
            jest.spyOn(console, 'error').mockImplementation(() => {});
            jest.spyOn(mockDatabase, 'getData').mockImplementation(() => {
                throw new Error('Database error');
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
    });

    describe('Cache get fallback', () => {
        it('should return cached empty array result', () => {
            // First search returns no results
            const results1 = searchRepository['resolveResultbyField'](
                'province',
                'NonExistent',
            );
            expect(results1).toEqual([]);

            // Second call should return cached empty array
            const results2 = searchRepository['resolveResultbyField'](
                'province',
                'NonExistent',
            );
            expect(results2).toEqual([]);
        });
    });
});
