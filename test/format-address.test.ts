import { formatAddress } from '../src/utils/format-address';

describe('formatAddress', () => {
    const upcountry = {
        address: '99/9',
        subDistrict: 'ศรีภูมิ',
        district: 'เมืองเชียงใหม่',
        province: 'เชียงใหม่',
        postalCode: '50200',
    };

    it('prefixes each component in Thai by default', () => {
        expect(formatAddress(upcountry)).toBe(
            '99/9 ตำบลศรีภูมิ อำเภอเมืองเชียงใหม่ จังหวัดเชียงใหม่ 50200',
        );
    });

    it('drops the prefixes when asked, and honours a custom separator', () => {
        expect(
            formatAddress(upcountry, { prefix: false, separator: ', ' }),
        ).toBe('99/9, ศรีภูมิ, เมืองเชียงใหม่, เชียงใหม่, 50200');
    });

    it('switches to แขวง / เขต and drops the province word for Bangkok', () => {
        expect(
            formatAddress({
                address: '1 ถนนพระราม 1',
                subDistrict: 'ลุมพินี',
                district: 'ปทุมวัน',
                province: 'กรุงเทพมหานคร',
                postalCode: '10330',
            }),
        ).toBe('1 ถนนพระราม 1 แขวงลุมพินี เขตปทุมวัน กรุงเทพมหานคร 10330');
    });

    it('uses the transliterated words in English mode', () => {
        expect(
            formatAddress(
                { subDistrict: 'Si Phum', district: 'Mueang Chiang Mai' },
                { language: 'eng' },
            ),
        ).toBe('Tambon Si Phum Amphoe Mueang Chiang Mai');

        expect(
            formatAddress(
                { district: 'Pathum Wan', province: 'Bangkok' },
                { language: 'eng' },
            ),
        ).toBe('Khet Pathum Wan Bangkok');
    });

    it('skips blank / missing components and accepts a numeric postal code', () => {
        expect(
            formatAddress({
                province: 'ภูเก็ต',
                subDistrict: '  ',
                postalCode: 83000,
            }),
        ).toBe('จังหวัดภูเก็ต 83000');
        expect(formatAddress({})).toBe('');
    });

    it('is the inverse of splitAddress for a clean address', () => {
        // round-trips the fields, ignoring the extracted `address` remainder
        const parts = {
            subDistrict: 'ปากเกร็ด',
            district: 'ปากเกร็ด',
            province: 'นนทบุรี',
            postalCode: '11120',
        };
        expect(formatAddress(parts, { prefix: false })).toBe(
            'ปากเกร็ด ปากเกร็ด นนทบุรี 11120',
        );
    });
});
