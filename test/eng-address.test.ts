import {
    setEngMode,
    getProvinceAll,
    getDistrictByProvince,
    getSubDistrictByDistrict,
    getZipCodeByDistrict,
    searchAddressByProvince,
    searchAddressByDistrict,
    searchAddressBySubDistrict,
    searchAddressByZipCode,
    splitAddress,
    translateWord,
} from '../src/thai-address';

setEngMode(true);

describe('Province Tests', () => {
    it('should return all provinces (77 total)', () => {
        const result = getProvinceAll();
        expect(result.length).toBe(77);
    });

    it('should not return null when calling getProvinceAll', () => {
        const result = getProvinceAll();
        expect(result).not.toBeNull();
    });
});

describe('District Tests', () => {
    it('should return 13 districts for "Saraburi"', () => {
        const result = getDistrictByProvince('Saraburi');
        expect(result.length).toBe(13);
    });

    it('should return an empty array when province name is empty', () => {
        const result = getDistrictByProvince('');
        expect(result.length).toBe(0);
    });
});

describe('Sub-District Tests', () => {
    it('should return 6 sub-districts for "Muak Lek"', () => {
        const result = getSubDistrictByDistrict('Muak Lek');
        expect(result.length).toBe(6);
    });

    it('should return an empty array when district name is empty', () => {
        const result = getSubDistrictByDistrict('');
        expect(result.length).toBe(0);
    });
});

describe('Zip Code Tests', () => {
    it('should return 1 zip code for "Tha Takiap"', () => {
        const result = getZipCodeByDistrict('Tha Takiap');
        expect(result.length).toBe(1);
    });

    it('should return an empty array when district name is empty', () => {
        const result = getZipCodeByDistrict('');
        expect(result.length).toBe(0);
    });
});

describe('Sub Districts with Multiple Zip Codes', () => {
    const sub_districts = [
        'Pran Buri',
        'Wang Phong',
        'Nong Ta Taem',
        'Khao Chao',
        'Sam Roi Yot',
        'Khao Noi',
    ];

    sub_districts.forEach((sub_district) => {
        it(`should return multiple results for sub district "${sub_district}"`, () => {
            const result = searchAddressBySubDistrict(sub_district);
            expect(result.length).toBeGreaterThan(1);
            expect(
                result.filter((item) => item.province === 'Prachuap Khiri Khan')
                    .length,
            ).toBe(2);
        });
    });
});

describe('Address Search Functions', () => {
    it('should return 1 result for district "Aranyaprathet"', () => {
        const result = searchAddressByDistrict('Aranyaprathet');
        expect(result.length).toBe(13);
    });

    it('should return an empty array for empty district name', () => {
        const result = searchAddressByDistrict('');
        expect(result.length).toBe(0);
    });

    it('should return 13 results for sub-district "Aranyaprathet"', () => {
        const result = searchAddressBySubDistrict('Aranyaprathet');
        expect(result.length).toBe(1);
    });

    it('should return results based on province "Sa Kaeo"', () => {
        let result = searchAddressByProvince('Sa Kaeo');
        expect(result.length).toBe(20);

        result = searchAddressByProvince('Sa Kaeo', 10);
        expect(result.length).toBe(10);
    });

    it('should return no results for non-existent province "Aranyaprathet"', () => {
        const result = searchAddressByProvince('Aranyaprathet');
        expect(result.length).toBe(0);
    });

    it('should return 15 results for zip code "27120"', () => {
        let result = searchAddressByZipCode('27120');
        expect(result.length).toBe(15);

        result = searchAddressByZipCode(27120);
        expect(result.length).toBe(15);

        result = searchAddressByZipCode(27120, 5);
        expect(result.length).toBe(5);
    });

    it('should return an empty array for empty zip code', () => {
        const result = searchAddressByZipCode('');
        expect(result.length).toBe(0);
    });
});

describe('Address Splitting Function', () => {
    it('should correctly split a complete address', () => {
        const addr =
            '126/548 Sukaprachasan Road, Kankea Housing Estate Pak Kret Pak Kret Nonthaburi Thailand 11120';
        const result = splitAddress(addr);
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

        invalidAddresses.forEach((addr) => {
            const result = splitAddress(addr);
            expect(result).toBeNull();
            expect(addr).toBe(addr); // Ensure the original address is not modified
        });
    });
});

describe('Translate Word Function', () => {
    it('should return the input word when no matching data is found in the database', () => {
        const result = translateWord('Welcome');

        expect(result).toBe('Welcome');
    });

    it('should return an empty string when the input is an empty string', () => {
        const result = translateWord('');

        expect(result).toBe('');
    });

    it('should return the correct Thai translation when a English word exists in the database', () => {
        const result = translateWord('Saraburi');

        expect(result).toBe('สระบุรี');
    });

    it('should correctly translate "Saraburi" to "สระบุรี" regardless of case', () => {
        const resultLower = translateWord('Saraburi'.toLowerCase());
        const resultUpper = translateWord('Saraburi'.toUpperCase());

        expect(resultLower).toBe('สระบุรี');
        expect(resultUpper).toBe('สระบุรี');
    });
});
