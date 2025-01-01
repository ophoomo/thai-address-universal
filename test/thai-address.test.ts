import {
    searchAddressByAmphoe,
    searchAddressByDistrict,
    searchAddressByProvince,
    searchAddressByZipcode,
    splitAddress,
} from '../src/thai-address';

describe('More than 1 zipcode District', () => {
    it('District ปราณบุรี should have 2 results', () => {
        const result = searchAddressByDistrict('ปราณบุรี');
        expect(result.length).toBe(2);
        expect(
            result.filter((item) => item.province === 'ประจวบคีรีขันธ์').length,
        ).toBe(2);
    });

    it('District วังก์พง should have 2 results', () => {
        const result = searchAddressByDistrict('วังก์พง');
        expect(result.length).toBe(2);
        expect(
            result.filter((item) => item.province === 'ประจวบคีรีขันธ์').length,
        ).toBe(2);
    });

    it('District หนองตาแต้ม should have 2 results', () => {
        const result = searchAddressByDistrict('หนองตาแต้ม');
        expect(result.length).toBe(2);
        expect(
            result.filter((item) => item.province === 'ประจวบคีรีขันธ์').length,
        ).toBe(2);
    });

    it('District เขาจ้าว should have 2 results', () => {
        const result = searchAddressByDistrict('เขาจ้าว');
        expect(result.length).toBe(2);
        expect(
            result.filter((item) => item.province === 'ประจวบคีรีขันธ์').length,
        ).toBe(2);
    });

    it('District สามร้อยยอด should have 2 results', () => {
        const result = searchAddressByDistrict('สามร้อยยอด');
        expect(result.length).toBe(2);
        expect(
            result.filter((item) => item.province === 'ประจวบคีรีขันธ์').length,
        ).toBe(2);
    });

    it('District เขาน้อย should have 2 results', () => {
        const result = searchAddressByDistrict('เขาน้อย');
        expect(
            result.filter((item) => item.province === 'ประจวบคีรีขันธ์').length,
        ).toBe(2);
    });
});

describe('#search', () => {
    it('searchAddressByDistrict', () => {
        let result = searchAddressByDistrict('อรัญประเทศ');
        expect(result.length).toBe(1);

        result = searchAddressByDistrict(' อรัญประเทศ');
        expect(result.length).toBe(1);

        result = searchAddressByDistrict('อรัญประเทศ ');
        expect(result.length).toBe(1);

        result = searchAddressByDistrict('  อรัญประเทศ  ');
        expect(result.length).toBe(1);

        result = searchAddressByDistrict('');
        expect(result.length).toBe(0);

        result = searchAddressByDistrict('  ');
        expect(result.length).toBe(0);
    });

    it('searchAddressByAmphoe', () => {
        let result = searchAddressByAmphoe('อรัญประเทศ');
        expect(result.length).toBe(13);

        result = searchAddressByAmphoe('');
        expect(result.length).toBe(0);
    });

    it('searchAddressByProvince', () => {
        let result = searchAddressByProvince('สระแก้ว');
        expect(result.length).toBe(20);

        result = searchAddressByProvince('สระแก้ว', 10);
        expect(result.length).toBe(10);

        result = searchAddressByProvince('อรัญประเทศ');
        expect(result.length).toBe(0);

        result = searchAddressByProvince('');
        expect(result.length).toBe(0);
    });

    it('searchAddressByZipcode', () => {
        let result = searchAddressByZipcode('27120');
        expect(result.length).toBe(15);

        result = searchAddressByZipcode(27120);
        expect(result.length).toBe(15);

        result = searchAddressByZipcode(27120, 5);
        expect(result.length).toBe(5);

        result = searchAddressByZipcode('');
        expect(result.length).toBe(0);
    });
});

describe('Function splitAddress', () => {
    it('should split address without modifying the original address', () => {
        const addr =
            '126/548 ถ.สุขาประชาสรรค์ ม.การเคหะนนท์ ปากเกร็ด ปากเกร็ด นนทบุรี Thailand 11120';
        const result = splitAddress(addr);
        expect(result).toEqual({
            address: '126/548 ถ.สุขาประชาสรรค์ ม.การเคหะนนท์',
            amphoe: 'ปากเกร็ด',
            district: 'ปากเกร็ด',
            province: 'นนทบุรี',
            zipcode: '11120',
        });

        expect(addr).toBe(
            '126/548 ถ.สุขาประชาสรรค์ ม.การเคหะนนท์ ปากเกร็ด ปากเกร็ด นนทบุรี Thailand 11120',
        );
    });

    it('should return null when it cannot split address', () => {
        const addr = '126/548 ถ.สุขประประชาสรรค์ ม.การเคหะนนท์';
        const result = splitAddress(addr);
        expect(result).toBeNull();

        expect(addr).toBe('126/548 ถ.สุขประประชาสรรค์ ม.การเคหะนนท์');
    });

    it('should return null when it cannot split address', () => {
        const addr =
            '126/548 ถ.สุขประประชาสรรค์ ม.การเคหะนนท์ ปากเกร็ด ปากเกร็ด Thailand 11120';
        const result = splitAddress(addr);
        expect(result).toBeNull();

        expect(addr).toBe(
            '126/548 ถ.สุขประประชาสรรค์ ม.การเคหะนนท์ ปากเกร็ด ปากเกร็ด Thailand 11120',
        );
    });

    it('should return null when it cannot split address', () => {
        const addr = '126/548 ถ.สุขประประชาสรรค์ ม.การเคหะนนท์ Thailand 11120';
        const result = splitAddress(addr);
        console.log(result);
        expect(result).toBeNull();

        expect(addr).toBe(
            '126/548 ถ.สุขประประชาสรรค์ ม.การเคหะนนท์ Thailand 11120',
        );
    });
});
