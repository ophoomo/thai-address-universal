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
} from '../src/thai-address';

setEngMode(true);

describe('Province', () => {
    it('get province all', () => {
        const result = getProvinceAll();
        expect(result.length).toBe(77);
    });

    it('should be result not null when call function', () => {
        const result = getProvinceAll();
        expect(result).not.toBeNull();
    });
});

describe('District', () => {
    it('get District with parameter', () => {
        const result = getDistrictByProvince('Amnat Charoen');
        expect(result.length).toBe(7);
    });

    it('should be [] when parameter is empty', () => {
        const result = getDistrictByProvince('');
        expect(result.length).toBe(0);
    });
});

describe('District', () => {
    it('get district with parameter', () => {
        const result = getSubDistrictByDistrict('Chanuman');
        expect(result.length).toBe(5);
    });

    it('should be [] when parameter is empty', () => {
        const result = getSubDistrictByDistrict('');
        expect(result.length).toBe(0);
    });
});

describe('Zip Code', () => {
    it('get zip code with parameter', () => {
        const result = getZipCodeByDistrict('Khok San');
        expect(result.length).toBe(1);
    });

    it('should be [] when parameter is empty', () => {
        const result = getZipCodeByDistrict('');
        expect(result.length).toBe(0);
    });
});

describe('More than 1 zipcode District', () => {
    it('District Pranburi should have 2 results', () => {
        const result = searchAddressByDistrict('Pran Buri');
        expect(result.length).toBe(1);
        expect(
            result.filter((item) => item.province === 'Prachuap Khiri Khan')
                .length,
        ).toBe(1);
    });

    it('District Wang Phong should have 2 results', () => {
        const result = searchAddressByDistrict('Wang Phong');
        expect(result.length).toBe(1);
        expect(
            result.filter((item) => item.province === 'Prachuap Khiri Khan')
                .length,
        ).toBe(1);
    });

    it('District Nong Ta Taem should have 2 results', () => {
        const result = searchAddressByDistrict('Nong Ta Taem');
        expect(result.length).toBe(1);
        expect(
            result.filter((item) => item.province === 'Prachuap Khiri Khan')
                .length,
        ).toBe(1);
    });

    it('District Khao Chao should have 2 results', () => {
        const result = searchAddressByDistrict('Khao Chao');
        expect(result.length).toBe(1);
        expect(
            result.filter((item) => item.province === 'Prachuap Khiri Khan')
                .length,
        ).toBe(1);
    });

    it('District Sam Roi Yot should have 2 results', () => {
        const result = searchAddressByDistrict('Sam Roi Yot');
        expect(result.length).toBe(1);
        expect(
            result.filter((item) => item.province === 'Prachuap Khiri Khan')
                .length,
        ).toBe(1);
    });

    it('District Khao Noi should have 2 results', () => {
        const result = searchAddressByDistrict('Khao Noi');
        expect(
            result.filter((item) => item.province === 'Prachuap Khiri Khan')
                .length,
        ).toBe(1);
    });
});

describe('#search', () => {
    it('searchAddressByDistrict', () => {
        let result = searchAddressByDistrict('Aranyaprathet');
        expect(result.length).toBe(1);

        result = searchAddressByDistrict(' Aranyaprathet');
        expect(result.length).toBe(1);

        result = searchAddressByDistrict('Aranyaprathet ');
        expect(result.length).toBe(1);

        result = searchAddressByDistrict('  Aranyaprathet  ');
        expect(result.length).toBe(1);

        result = searchAddressByDistrict('');
        expect(result.length).toBe(0);

        result = searchAddressByDistrict('  ');
        expect(result.length).toBe(0);
    });

    it('searchAddressByDistrict', () => {
        let result = searchAddressByDistrict('Aranyaprathet');
        expect(result.length).toBe(13);

        result = searchAddressByDistrict('');
        expect(result.length).toBe(0);
    });

    it('searchAddressBySubDistrict', () => {
        let result = searchAddressBySubDistrict('อรัญประเทศ');
        expect(result.length).toBe(13);

        result = searchAddressBySubDistrict('');
        expect(result.length).toBe(0);
    });

    it('searchAddressByProvince', () => {
        let result = searchAddressByProvince('Sa Kaeo');
        expect(result.length).toBe(20);

        result = searchAddressByProvince('Sa Kaeo', 10);
        expect(result.length).toBe(10);

        result = searchAddressByProvince('Aranyaprathet');
        expect(result.length).toBe(0);

        result = searchAddressByProvince('');
        expect(result.length).toBe(0);
    });

    it('searchAddressByZipcode', () => {
        let result = searchAddressByZipCode('27120');
        expect(result.length).toBe(17);

        result = searchAddressByZipCode(27120);
        expect(result.length).toBe(17);

        result = searchAddressByZipCode(27120, 5);
        expect(result.length).toBe(5);

        result = searchAddressByZipCode('');
        expect(result.length).toBe(0);
    });
});

describe('Function splitAddress', () => {
    it('should split address without modifying the original address', () => {
        const addr =
            '126/548 Sukaprachasan Road Khae Ha Nonth Pak Kret Pak Kret Nonthaburi Thailand 11120';
        const result = splitAddress(addr);
        expect(result).toEqual({
            address: '126/548 Sukaprachasan Road Khae Ha Nonth',
            District: 'Pak Kret',
            district: 'Pak Kret',
            province: 'Nonthaburi',
            zipcode: '11120',
        });

        expect(addr).toBe(
            '126/548 Sukaprachasan Road Khae Ha Nonth Pak Kret Pak Kret Nonthaburi Thailand 11120',
        );
    });

    it('should return null when it cannot split address', () => {
        const addr = '126/548 Sukaprachasan Road Khae Ha Nonth';
        const result = splitAddress(addr);
        expect(result).toBeNull();

        expect(addr).toBe('126/548 Sukaprachasan Road Khae Ha Nonth');
    });

    it('should return null when it cannot split address', () => {
        const addr =
            '126/548 Sukaprachasan Road Khae Ha Nonth Pak Kret Pak Kret Thailand 11120';
        const result = splitAddress(addr);
        expect(result).toBeNull();

        expect(addr).toBe(
            '126/548 Sukaprachasan Road Khae Ha Nonth Pak Kret Pak Kret Thailand 11120',
        );
    });

    it('should return null when it cannot split address', () => {
        const addr = '126/548 Sukaprachasan Road Khae Ha Nonth Thailand 11120';
        const result = splitAddress(addr);
        expect(result).toBeNull();

        expect(addr).toBe(
            '126/548 Sukaprachasan Road Khae Ha Nonth Thailand 11120',
        );
    });
});
