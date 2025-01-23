import {
    setEngMode,
    getProvinceAll,
    getDistrictByProvince,
    getSubDistrictByDistrict,
    getPostalCodeByDistrict,
    searchAddressByProvince,
    searchAddressByDistrict,
    searchAddressBySubDistrict,
    searchAddressByPostalCode,
    splitAddress,
    translateWord,
    loadThaiDatabase,
    resolveResultbyField,
} from '../src/thai-address';

import * as ThaiAddress from '../src/thai-address';

setEngMode(false);

describe('Province Tests', () => {
    it('should return all provinces (77 total)', async () => {
        const result = await getProvinceAll();
        expect(result.length).toBe(77);
    });

    it('should not return null when calling getProvinceAll', async () => {
        const result = await getProvinceAll();
        expect(result).not.toBeNull();
    });
});

describe('District Tests', () => {
    it('should return 13 districts for "สระบุรี"', async () => {
        const result = await getDistrictByProvince('สระบุรี');
        expect(result.length).toBe(13);
    });

    it('should return an empty array when province name is empty', async () => {
        const result = await getDistrictByProvince('');
        expect(result.length).toBe(0);
    });
});

describe('Sub-District Tests', () => {
    it('should return 6 sub-districts for "มวกเหล็ก"', async () => {
        const result = await getSubDistrictByDistrict('มวกเหล็ก');
        expect(result.length).toBe(6);
    });

    it('should return an empty array when district name is empty', async () => {
        const result = await getSubDistrictByDistrict('');
        expect(result.length).toBe(0);
    });
});

describe('Postal Code Tests', () => {
    it('should return 1 postal code for "ท่าตะเกียบ"', async () => {
        const result = await getPostalCodeByDistrict('ท่าตะเกียบ');
        expect(result.length).toBe(1);
    });

    it('should return an empty array when district name is empty', async () => {
        const result = await getPostalCodeByDistrict('');
        expect(result.length).toBe(0);
    });
});

describe('Sub Districts with Multiple Postal Codes', () => {
    const sub_districts = [
        'ปราณบุรี',
        'วังก์พง',
        'หนองตาแต้ม',
        'เขาจ้าว',
        'สามร้อยยอด',
        'เขาน้อย',
    ];

    sub_districts.forEach((sub_district) => {
        it(`should return multiple results for sub district "${sub_district}"`, async () => {
            const result = await searchAddressBySubDistrict(sub_district);
            expect(result.length).toBeGreaterThan(1);
            expect(
                result.filter((item) => item.province === 'ประจวบคีรีขันธ์')
                    .length,
            ).toBe(2);
        });
    });
});

describe('Address Search Functions', () => {
    it('should return 1 result for district "อรัญประเทศ"', async () => {
        const result = await searchAddressByDistrict('อรัญประเทศ');
        expect(result.length).toBe(13);
    });

    it('should return an empty array for empty district name', async () => {
        const result = await searchAddressByDistrict('');
        expect(result.length).toBe(0);
    });

    it('should return 13 results for sub-district "อรัญประเทศ"', async () => {
        const result = await searchAddressBySubDistrict('อรัญประเทศ');
        expect(result.length).toBe(1);
    });

    it('should return results based on province "สระแก้ว"', async () => {
        let result = await searchAddressByProvince('สระแก้ว');
        expect(result.length).toBe(20);

        result = await searchAddressByProvince('สระแก้ว', 10);
        expect(result.length).toBe(10);
    });

    it('should return no results for non-existent province "อรัญประเทศ"', async () => {
        const result = await searchAddressByProvince('อรัญประเทศ');
        expect(result.length).toBe(0);
    });

    it('should return 15 results for postal code "27120"', async () => {
        let result = await searchAddressByPostalCode('27120');
        expect(result.length).toBe(15);

        result = await searchAddressByPostalCode(27120);
        expect(result.length).toBe(15);

        result = await searchAddressByPostalCode(27120, 5);
        expect(result.length).toBe(5);
    });

    it('should return an empty array for empty postal code', async () => {
        const result = await searchAddressByPostalCode('');
        expect(result.length).toBe(0);
    });
});

describe('Address Splitting Function', () => {
    it('should correctly split a complete address', async () => {
        const addr =
            '126/548 ถ.สุขาประชาสรรค์ ม.การเคหะนนท์ ปากเกร็ด ปากเกร็ด นนทบุรี Thailand 11120';
        const result = await splitAddress(addr);
        expect(result).toEqual({
            address: '126/548 ถ.สุขาประชาสรรค์ ม.การเคหะนนท์',
            district: 'ปากเกร็ด',
            sub_district: 'ปากเกร็ด',
            province: 'นนทบุรี',
            postal_code: '11120',
        });
        expect(addr).toBe(addr); // Ensure the original address is not modified
    });

    it('should return null when unable to split address', () => {
        const invalidAddresses = [
            '126/548 ถ.สุขประประชาสรรค์ ม.การเคหะนนท์',
            '126/548 ถ.สุขประประชาสรรค์ ม.การเคหะนนท์ ปากเกร็ด ปากเกร็ด Thailand 11120',
            '126/548 ถ.สุขประประชาสรรค์ ม.การเคหะนนท์ Thailand 11120',
        ];

        invalidAddresses.forEach(async (addr) => {
            const result = await splitAddress(addr);
            expect(result).toBeNull();
            expect(addr).toBe(addr); // Ensure the original address is not modified
        });
    });
});

describe('Translate Word Function', () => {
    it('should return the input word when no matching data is found in the database', async () => {
        const result = await translateWord('สวัสดีครับ');

        expect(result).toBe('สวัสดีครับ');
    });

    it('should return an empty string when the input is an empty string', async () => {
        const result = await translateWord('');

        expect(result).toBe('');
    });

    it('should return the correct English translation when a Thai word exists in the database', async () => {
        const result = await translateWord('สระบุรี');

        expect(result).toBe('Saraburi');
    });
});

describe('Database Loading Errors', () => {
    it('should log an error when Thai database loading fails', async () => {
        const db = jest.mock('../migrate/output/th_db.json', () => {
            throw new Error('Failed to load JSON');
        });

        const consoleErrorSpy = jest
            .spyOn(console, 'error')
            .mockImplementation();

        await loadThaiDatabase();

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            'Error loading Thai database',
            expect.any(Error),
        );
        consoleErrorSpy.mockRestore();
        db.restoreAllMocks();
    });
});

describe('resolveResultbyField Function', () => {
    it('should return empty array if error occurs during filtering', async () => {
        const db = jest
            .spyOn(ThaiAddress, 'db')
            .mockRejectedValue(new Error('Database error'));
        const consoleErrorSpy = jest
            .spyOn(console, 'error')
            .mockImplementation();

        const result = await resolveResultbyField('province', 'Test', 3);

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            'Error during filtering:',
            expect.any(Error),
        );
        expect(result).toEqual([]);
        consoleErrorSpy.mockRestore();
        db.mockRestore();
    });
});
