import { SearchRepository } from '../src/core/search';
import { IDatabase } from '../src/types/database';

describe('resolveResultbyField Function', () => {
    let searchRepository: SearchRepository;
    let mockDatabase: IDatabase;

    beforeEach(() => {
        mockDatabase = {
            getData: jest.fn(() => [
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
            ]),
        } as unknown as IDatabase;

        searchRepository = new SearchRepository(mockDatabase);
    });

    describe('resolveResultbyField', () => {
        it('should return matching results for province field', () => {
            const results = searchRepository['resolveResultbyField'](
                'province',
                'Bangkok',
            );
            expect(results.length).toBe(2);
            expect(results[0].province).toBe('Bangkok');
            expect(results[1].province).toBe('Bangkok');
        });

        it('should return matching results for district field', () => {
            const results = searchRepository['resolveResultbyField'](
                'district',
                'Sathon',
            );
            expect(results.length).toBe(1);
            expect(results[0].district).toBe('Sathon');
        });

        it('should return matching results for sub_district field', () => {
            const results = searchRepository['resolveResultbyField'](
                'sub_district',
                'Si Phum',
            );
            expect(results.length).toBe(1);
            expect(results[0].sub_district).toBe('Si Phum');
        });

        it('should return matching results for postal_code field', () => {
            const results = searchRepository['resolveResultbyField'](
                'postal_code',
                '10120',
            );
            expect(results.length).toBe(1);
            expect(results[0].postal_code).toBe('10120');
        });

        it('should return empty array if no match found', () => {
            const results = searchRepository['resolveResultbyField'](
                'province',
                'NonExistentProvince',
            );
            expect(results.length).toBe(0);
        });

        it('should return empty array if search string is empty', () => {
            const results = searchRepository['resolveResultbyField'](
                'province',
                '',
            );
            expect(results.length).toBe(0);
        });

        it('should limit results based on maxResult parameter', () => {
            const results = searchRepository['resolveResultbyField'](
                'province',
                'Bangkok',
                1,
            );
            expect(results.length).toBe(1);
            expect(results[0].province).toBe('Bangkok');
        });

        it('should handle case-insensitive search', () => {
            const results = searchRepository['resolveResultbyField'](
                'province',
                'bangkok',
            );
            expect(results.length).toBe(2);
            expect(results[0].province).toBe('Bangkok');
            expect(results[1].province).toBe('Bangkok');
        });

        it('should handle numeric search strings', () => {
            const results = searchRepository['resolveResultbyField'](
                'postal_code',
                10120,
            );
            expect(results.length).toBe(1);
            expect(results[0].postal_code).toBe('10120');
        });

        it('should log error and return empty array if an error occurs', () => {
            jest.spyOn(console, 'error').mockImplementation(() => {});
            jest.spyOn(mockDatabase, 'getData').mockImplementation(() => {
                throw new Error('Test error');
            });

            const results = searchRepository['resolveResultbyField'](
                'province',
                'Bangkok',
            );
            expect(results.length).toBe(0);
            expect(console.error).toHaveBeenCalledWith(
                'Error during filtering:',
                expect.any(Error),
            );
        });
    });
});
