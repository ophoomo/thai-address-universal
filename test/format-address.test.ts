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

    it('leaves the prefixes out by default in English mode', () => {
        expect(
            formatAddress(
                {
                    address: '99/9',
                    subDistrict: 'Si Phum',
                    district: 'Mueang Chiang Mai',
                    province: 'Chiang Mai',
                    postalCode: '50200',
                },
                { language: 'eng' },
            ),
        ).toBe('99/9 Si Phum Mueang Chiang Mai Chiang Mai 50200');

        expect(
            formatAddress(
                {
                    subDistrict: 'Lumphini',
                    district: 'Pathum Wan',
                    province: 'Bangkok',
                    postalCode: '10330',
                },
                { language: 'eng', separator: ', ' },
            ),
        ).toBe('Lumphini, Pathum Wan, Bangkok, 10330');
    });

    it('still prefixes Thai by default (the default depends on the language)', () => {
        expect(
            formatAddress(
                { subDistrict: 'ศรีภูมิ', district: 'เมืองเชียงใหม่' },
                { language: 'thai' },
            ),
        ).toBe('ตำบลศรีภูมิ อำเภอเมืองเชียงใหม่');
    });

    it('uses the transliterated words in English mode when asked', () => {
        expect(
            formatAddress(
                { subDistrict: 'Si Phum', district: 'Mueang Chiang Mai' },
                { language: 'eng', prefix: true },
            ),
        ).toBe('Tambon Si Phum Amphoe Mueang Chiang Mai');

        expect(
            formatAddress(
                { district: 'Pathum Wan', province: 'Bangkok' },
                { language: 'eng', prefix: true },
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

    it('accepts the snake_case fields splitAddress returns', () => {
        expect(
            formatAddress({
                address: '99/9',
                sub_district: 'ศรีภูมิ',
                district: 'เมืองเชียงใหม่',
                province: 'เชียงใหม่',
                postal_code: '50200',
            }),
        ).toBe('99/9 ตำบลศรีภูมิ อำเภอเมืองเชียงใหม่ จังหวัดเชียงใหม่ 50200');
    });

    it('prefers camelCase when both spellings are given', () => {
        expect(
            formatAddress({
                subDistrict: 'ศรีภูมิ',
                sub_district: 'ช้างม่อย',
                postalCode: '50200',
                postal_code: '50300',
            }),
        ).toBe('ตำบลศรีภูมิ 50200');
    });

    it('infers English from Latin-only names when no language is given', () => {
        const parts = {
            address: '99/9',
            subDistrict: 'Si Phum',
            district: 'Mueang Chiang Mai',
            province: 'Chiang Mai',
            postalCode: '50200',
        };
        expect(formatAddress(parts)).toBe(
            '99/9 Si Phum Mueang Chiang Mai Chiang Mai 50200',
        );
        expect(formatAddress(parts, { prefix: true })).toBe(
            '99/9 Tambon Si Phum Amphoe Mueang Chiang Mai Changwat Chiang Mai 50200',
        );
        // An explicit language still wins.
        expect(formatAddress(parts, { language: 'thai' })).toBe(
            '99/9 ตำบลSi Phum อำเภอMueang Chiang Mai จังหวัดChiang Mai 50200',
        );
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
