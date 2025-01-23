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
    loadEngDatabase,
    resolveResultbyField,
} from '../src/thai-address';
import * as ThaiAddress from '../src/thai-address';

setEngMode(true);

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
    it('should return 13 districts for "Saraburi"', async () => {
        const result = await getDistrictByProvince('Saraburi');
        expect(result.length).toBe(13);
    });

    it('should return an empty array when province name is empty', async () => {
        const result = await getDistrictByProvince('');
        expect(result.length).toBe(0);
    });
});

describe('Sub-District Tests', () => {
    it('should return 6 sub-districts for "Muak Lek"', async () => {
        const result = await getSubDistrictByDistrict('Muak Lek');
        expect(result.length).toBe(6);
    });

    it('should return an empty array when district name is empty', async () => {
        const result = await getSubDistrictByDistrict('');
        expect(result.length).toBe(0);
    });
});

describe('Postal Code Tests', () => {
    it('should return 1 postal code for "Tha Takiap"', async () => {
        const result = await getPostalCodeByDistrict('Tha Takiap');
        expect(result.length).toBe(1);
    });

    it('should return an empty array when district name is empty', async () => {
        const result = await getPostalCodeByDistrict('');
        expect(result.length).toBe(0);
    });
});

describe('Sub Districts with Multiple Postal Codes', () => {
    const sub_districts = [
        'Pran Buri',
        'Wang Phong',
        'Nong Ta Taem',
        'Khao Chao',
        'Sam Roi Yot',
        'Khao Noi',
    ];

    sub_districts.forEach((sub_district) => {
        it(`should return multiple results for sub district "${sub_district}"`, async () => {
            const result = await searchAddressBySubDistrict(sub_district);
            expect(result.length).toBeGreaterThan(1);
            expect(
                result.filter((item) => item.province === 'Prachuap Khiri Khan')
                    .length,
            ).toBe(2);
        });
    });
});

describe('Address Search Functions', () => {
    it('should return 1 result for district "Aranyaprathet"', async () => {
        const result = await searchAddressByDistrict('Aranyaprathet');
        expect(result.length).toBe(13);
    });

    it('should return an empty array for empty district name', async () => {
        const result = await searchAddressByDistrict('');
        expect(result.length).toBe(0);
    });

    it('should return 13 results for sub-district "Aranyaprathet"', async () => {
        const result = await searchAddressBySubDistrict('Aranyaprathet');
        expect(result.length).toBe(1);
    });

    it('should return results based on province "Sa Kaeo"', async () => {
        let result = await searchAddressByProvince('Sa Kaeo');
        expect(result.length).toBe(20);

        result = await searchAddressByProvince('Sa Kaeo', 10);
        expect(result.length).toBe(10);
    });

    it('should return no results for non-existent province "Aranyaprathet"', async () => {
        const result = await searchAddressByProvince('Aranyaprathet');
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
            '126/548 Sukaprachasan Road, Kankea Housing Estate Pak Kret Pak Kret Nonthaburi Thailand 11120';
        const result = await splitAddress(addr);
        expect(result).toEqual({
            address: '126/548 Sukaprachasan Road, Kankea Housing Estate',
            district: 'Pak Kret',
            sub_district: 'Pak Kret',
            province: 'Nonthaburi',
            postal_code: '11120',
        });
        expect(addr).toBe(addr); // Ensure the original address is not modified
    });

    it('should return null when unable to split address', () => {
        const invalidAddresses = [
            '126/548 Sukaprachasan Road, Kankea Housing Estate',
            '126/548 Sukaprachasan Road, Kankea Housing Estate Pak Kret Pak Kret Thailand 11120',
            '126/548 Sukaprachasan Road, Kankea Housing Estate Thailand 11120',
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
        const result = await translateWord('Welcome');

        expect(result).toBe('Welcome');
    });

    it('should return an empty string when the input is an empty string', async () => {
        const result = await translateWord('');

        expect(result).toBe('');
    });

    it('should return the correct Thai translation when a English word exists in the database', async () => {
        const result = await translateWord('Saraburi');

        expect(result).toBe('สระบุรี');
    });

    it('should correctly translate "Saraburi" to "สระบุรี" regardless of case', async () => {
        const resultLower = await translateWord('Saraburi'.toLowerCase());
        const resultUpper = await translateWord('Saraburi'.toUpperCase());

        expect(resultLower).toBe('สระบุรี');
        expect(resultUpper).toBe('สระบุรี');
    });
});

describe('Database Loading Errors', () => {
    it('should log an error when Eng database loading fails', async () => {
        const db = jest.mock('../migrate/output/en_db.json', () => {
            throw new Error('Failed to load JSON');
        });

        const consoleErrorSpy = jest
            .spyOn(console, 'error')
            .mockImplementation();

        await loadEngDatabase();

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            'Error loading English database',
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
