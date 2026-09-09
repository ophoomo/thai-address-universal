import type { IExpanded, IExpandedWithPoint } from '../src/types/thai-address';
import {
    calculateMatchPoints,
    cleanupAddress,
    getBestResult,
    prepareAddress,
} from '../src/utils/split-address';

describe('Split Address Utilities', () => {
    describe('prepareAddress', () => {
        it('should remove postal code from address', () => {
            const result = prepareAddress(
                'Bangkok สระบุรี 18120 Thailand',
                '18120',
            );
            expect(result).not.toContain('18120');
        });

        it('should remove location abbreviations', () => {
            const result = prepareAddress(
                'ต. ลุมพินี อ. ปทุมวัน จ. กรุงเทพ',
                '10330',
            );
            expect(result).not.toContain('ต.');
            expect(result).not.toContain('อ.');
            expect(result).not.toContain('จ.');
        });

        it('should replace Bangkok abbreviations with full name', () => {
            const result = prepareAddress('กทม. 10330', '10330');
            expect(result).toContain('กรุงเทพมหานคร');
        });

        it('should handle multiple Bangkok abbreviations', () => {
            const result = prepareAddress('กรุงเทพ กรุงเทพฯ กทม 10330', '10330');
            expect(result).toContain('กรุงเทพมหานคร');
        });

        it('should remove Thailand keyword', () => {
            const result = prepareAddress('Bangkok Thailand 10330', '10330');
            expect(result).not.toContain('Thailand');
        });

        it('should escape special regex characters in postal code', () => {
            // Postal code with special characters
            const result = prepareAddress('Bangkok 123.45 Thailand', '123.45');
            expect(result).not.toContain('123.45');
        });

        it('should trim whitespace', () => {
            const result = prepareAddress('  Bangkok  10330  ', '10330');
            expect(result).not.toMatch(/^\s|\s$/);
        });

        it('should not double-expand an already-full "กรุงเทพมหานคร"', () => {
            const result = prepareAddress('ลุมพินี ปทุมวัน กรุงเทพมหานคร', '10330');
            expect(result).toContain('กรุงเทพมหานคร');
            expect(result).not.toContain('กรุงเทพมหานครมหานคร');
        });

        it('should still expand the short Bangkok forms', () => {
            expect(prepareAddress('ปทุมวัน กทม. 10330', '10330')).toContain(
                'กรุงเทพมหานคร',
            );
            expect(prepareAddress('ปทุมวัน กรุงเทพฯ 10330', '10330')).toContain(
                'กรุงเทพมหานคร',
            );
        });
    });

    describe('calculateMatchPoints', () => {
        const mockElement: IExpandedWithPoint = {
            province: 'Bangkok',
            district: 'Pathum Wan',
            sub_district: 'Lumphini',
            postal_code: '10330',
            point: 0,
        };

        it('should return 3 when all fields match', () => {
            const address = 'Bangkok Pathum Wan Lumphini';
            expect(calculateMatchPoints(mockElement, address)).toBe(3);
        });

        it('should return 2 when two fields match', () => {
            const address = 'Bangkok Pathum Wan';
            expect(calculateMatchPoints(mockElement, address)).toBe(2);
        });

        it('should return 1 when one field matches', () => {
            const address = 'Bangkok';
            expect(calculateMatchPoints(mockElement, address)).toBe(1);
        });

        it('should return 0 when no fields match', () => {
            const address = 'Non-existent location';
            expect(calculateMatchPoints(mockElement, address)).toBe(0);
        });
    });

    describe('getBestResult', () => {
        const mockResults: IExpandedWithPoint[] = [
            {
                province: 'Bangkok',
                district: 'Pathum Wan',
                sub_district: 'Lumphini',
                postal_code: '10330',
                point: 0,
            },
            {
                province: 'Bangkok',
                district: 'Sathon',
                sub_district: 'Thung Maha Mek',
                postal_code: '10120',
                point: 0,
            },
            {
                province: 'Chiang Mai',
                district: 'Mueang Chiang Mai',
                sub_district: 'Si Phum',
                postal_code: '50200',
                point: 0,
            },
        ];

        it('should return best result when max points is 3', () => {
            const address = 'Bangkok Pathum Wan Lumphini';
            const result = getBestResult(mockResults, address);

            expect(result).not.toBeNull();
            expect(result?.province).toBe('Bangkok');
            expect(result?.sub_district).toBe('Lumphini');
            expect(result?.point).toBe(3);
        });

        it('should return null when best match is less than 3 points', () => {
            const address = 'Bangkok Pathum Wan';
            const result = getBestResult(mockResults, address);

            expect(result).toBeNull();
        });

        it('should return null when no results provided', () => {
            const result = getBestResult([], 'Bangkok');
            expect(result).toBeNull();
        });

        it('should select first highest scoring result on tie', () => {
            const mixedResults: IExpandedWithPoint[] = [
                {
                    province: 'Bangkok',
                    district: 'Pathum Wan',
                    sub_district: 'Lumphini',
                    postal_code: '10330',
                    point: 0,
                },
                {
                    province: 'Bangkok',
                    district: 'Pathum Wan',
                    sub_district: 'Silom',
                    postal_code: '10500',
                    point: 0,
                },
            ];

            const address = 'Bangkok Pathum Wan Lumphini';
            const result = getBestResult(mixedResults, address);

            expect(result?.sub_district).toBe('Lumphini');
        });

        it('breaks a 3/3 tie toward the row that covers the most distinct words', () => {
            const address = 'ลุมพินี ปทุมวัน กรุงเทพมหานคร';
            const results: IExpandedWithPoint[] = [
                {
                    province: 'กรุงเทพมหานคร',
                    district: 'ปทุมวัน',
                    sub_district: 'ปทุมวัน',
                    postal_code: '10330',
                    point: 0,
                },
                {
                    province: 'กรุงเทพมหานคร',
                    district: 'ปทุมวัน',
                    sub_district: 'ลุมพินี',
                    postal_code: '10330',
                    point: 0,
                },
            ];
            // The 2nd row maps sub-district + district onto two different
            // words; the 1st reuses "ปทุมวัน" for both.
            expect(getBestResult(results, address)?.sub_district).toBe('ลุมพินี');
        });

        it('is order-independent for that tie-break', () => {
            const address = 'ลุมพินี ปทุมวัน กรุงเทพมหานคร';
            const results: IExpandedWithPoint[] = [
                {
                    province: 'กรุงเทพมหานคร',
                    district: 'ปทุมวัน',
                    sub_district: 'ลุมพินี',
                    postal_code: '10330',
                    point: 0,
                },
                {
                    province: 'กรุงเทพมหานคร',
                    district: 'ปทุมวัน',
                    sub_district: 'ปทุมวัน',
                    postal_code: '10330',
                    point: 0,
                },
            ];
            expect(getBestResult(results, address)?.sub_district).toBe('ลุมพินี');
        });

        it('falls back to "sub-district is its own word" when word coverage ties', () => {
            // "1ศาลาแดง" glues the house number to the sub-district name, so
            // both rows cover the same 3 words — the tie is broken toward the
            // row whose sub-district stands alone as a word ("สีลม").
            const address = '1ศาลาแดง สีลม บางรัก กรุงเทพมหานคร';
            const results: IExpandedWithPoint[] = [
                {
                    province: 'กรุงเทพมหานคร',
                    district: 'บางรัก',
                    sub_district: 'ศาลาแดง',
                    postal_code: '10500',
                    point: 0,
                },
                {
                    province: 'กรุงเทพมหานคร',
                    district: 'บางรัก',
                    sub_district: 'สีลม',
                    postal_code: '10500',
                    point: 0,
                },
            ];
            expect(getBestResult(results, address)?.sub_district).toBe('สีลม');
        });
    });

    describe('cleanupAddress', () => {
        const mockResult = {
            province: 'Bangkok',
            district: 'Pathum Wan',
            sub_district: 'Lumphini',
            postal_code: '10330',
        };

        it('should remove address components from address string', () => {
            const address = ' Bangkok Pathum Wan Lumphini 123 Moo 4';
            const result = cleanupAddress(address, mockResult);

            expect(result).not.toContain('Bangkok');
            expect(result).not.toContain('Pathum Wan');
            expect(result).not.toContain('Lumphini');
            expect(result).toContain('123 Moo 4');
        });

        it('should trim whitespace after cleanup', () => {
            const address = '  Bangkok Pathum Wan Lumphini  ';
            const result = cleanupAddress(address, mockResult);

            expect(result).not.toMatch(/^\s|\s$/);
        });

        it('should handle missing address components gracefully', () => {
            const partialResult = {
                province: 'Bangkok',
                district: '',
                sub_district: 'Lumphini',
                postal_code: '10330',
            } as IExpanded;

            const address = ' Bangkok Lumphini 123 Street';
            const result = cleanupAddress(address, partialResult);

            expect(result).toContain('123 Street');
        });

        it('should handle empty address string', () => {
            const result = cleanupAddress('', mockResult);
            expect(result).toBe('');
        });

        it('should only remove exact field value matches with space prefix', () => {
            const address = 'BangkokVille Bangkok Pathum Wan Lumphini';
            const result = cleanupAddress(address, mockResult);

            // BangkokVille should remain (doesn't have space prefix)
            expect(result).toContain('BangkokVille');
            // Bangkok should be removed (has space prefix)
            expect(result).not.toContain(' Bangkok');
        });
    });
});
