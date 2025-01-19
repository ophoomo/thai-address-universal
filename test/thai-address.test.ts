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

setEngMode(false);

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
    it('should return 13 districts for "สระบุรี"', () => {
        const result = getDistrictByProvince('สระบุรี');
        expect(result.length).toBe(13);
    });

    it('should return an empty array when province name is empty', () => {
        const result = getDistrictByProvince('');
        expect(result.length).toBe(0);
    });
});

describe('Sub-District Tests', () => {
    it('should return 6 sub-districts for "มวกเหล็ก"', () => {
        const result = getSubDistrictByDistrict('มวกเหล็ก');
        expect(result.length).toBe(6);
    });

    it('should return an empty array when district name is empty', () => {
        const result = getSubDistrictByDistrict('');
        expect(result.length).toBe(0);
    });
});

describe('Zip Code Tests', () => {
    it('should return 1 zip code for "ท่าตะเกียบ"', () => {
        const result = getZipCodeByDistrict('ท่าตะเกียบ');
        expect(result.length).toBe(1);
    });

    it('should return an empty array when district name is empty', () => {
        const result = getZipCodeByDistrict('');
        expect(result.length).toBe(0);
    });
});

describe('Sub Districts with Multiple Zip Codes', () => {
    const sub_districts = [
        'ปราณบุรี',
        'วังก์พง',
        'หนองตาแต้ม',
        'เขาจ้าว',
        'สามร้อยยอด',
        'เขาน้อย',
    ];

    sub_districts.forEach((sub_district) => {
        it(`should return multiple results for sub district "${sub_district}"`, () => {
            const result = searchAddressBySubDistrict(sub_district);
            expect(result.length).toBeGreaterThan(1);
            expect(
                result.filter((item) => item.province === 'ประจวบคีรีขันธ์')
                    .length,
            ).toBe(2);
        });
    });
});

describe('Address Search Functions', () => {
    it('should return 1 result for district "อรัญประเทศ"', () => {
        const result = searchAddressByDistrict('อรัญประเทศ');
        expect(result.length).toBe(13);
    });

    it('should return an empty array for empty district name', () => {
        const result = searchAddressByDistrict('');
        expect(result.length).toBe(0);
    });

    it('should return 13 results for sub-district "อรัญประเทศ"', () => {
        const result = searchAddressBySubDistrict('อรัญประเทศ');
        expect(result.length).toBe(1);
    });

    it('should return results based on province "สระแก้ว"', () => {
        let result = searchAddressByProvince('สระแก้ว');
        expect(result.length).toBe(20);

        result = searchAddressByProvince('สระแก้ว', 10);
        expect(result.length).toBe(10);
    });

    it('should return no results for non-existent province "อรัญประเทศ"', () => {
        const result = searchAddressByProvince('อรัญประเทศ');
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
            '126/548 ถ.สุขาประชาสรรค์ ม.การเคหะนนท์ ปากเกร็ด ปากเกร็ด นนทบุรี Thailand 11120';
        const result = splitAddress(addr);
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

        invalidAddresses.forEach((addr) => {
            const result = splitAddress(addr);
            expect(result).toBeNull();
            expect(addr).toBe(addr); // Ensure the original address is not modified
        });
    });
});

describe('Translate Word Function', () => {
    it('should return the input word when no matching data is found in the database', () => {
        const result = translateWord('สวัสดีครับ');

        expect(result).toBe('สวัสดีครับ');
    });

    it('should return an empty string when the input is an empty string', () => {
        const result = translateWord('');

        expect(result).toBe('');
    });

    it('should return the correct English translation when a Thai word exists in the database', () => {
        const result = translateWord('สระบุรี');

        expect(result).toBe('Saraburi');
    });
});
