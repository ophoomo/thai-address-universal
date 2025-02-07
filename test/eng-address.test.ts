import {
    setEngMode,
    getProvinceAll,
    getDistrictByProvince,
    getSubDistrictByDistrict,
    searchAddressByProvince,
    searchAddressByDistrict,
    searchAddressBySubDistrict,
    searchAddressByPostalCode,
    splitAddress,
    translateWord,
    getEngMode,
    getPostalCodeBySubDistrict,
    getDatabase,
} from '../src/core/thai-address';

setEngMode(true);

describe('getDatabase Function', () => {
    it('should return database', async () => {
        const result = await getDatabase();
        expect(result.length).toBeGreaterThan(0);
    });
});

describe('EngMode Tests', () => {
    it('should return true', () => {
        expect(getEngMode()).toBe(true);
    });
});

describe('Province Tests', () => {
    it('should return all provinces (77 total)', async () => {
        const result = await getProvinceAll();
        expect(result.length).toBe(77);
    });

    it('should not return null when calling getProvinceAll', () => {
        const result = getProvinceAll();
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
        const result = await getPostalCodeBySubDistrict('Tha Takiap');
        expect(result.length).toBe(1);
    });

    it('should return an empty array when district name is empty', async () => {
        const result = await getPostalCodeBySubDistrict('');
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
