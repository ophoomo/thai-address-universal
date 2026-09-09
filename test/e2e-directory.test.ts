import {
    getByGeocode,
    getDistricts,
    getProvinces,
    getSubDistricts,
    resetDirectoryCache,
} from '../src/core/directory';

beforeAll(() => {
    resetDirectoryCache();
});

describe('structured directory', () => {
    it('lists 77 provinces with both names and a 2-digit code', async () => {
        const provinces = await getProvinces();
        expect(provinces).toHaveLength(77);

        const bangkok = provinces.find((p) => p.nameEn === 'Bangkok');
        expect(bangkok).toEqual({
            nameTh: 'กรุงเทพมหานคร',
            nameEn: 'Bangkok',
            code: '10',
        });
        expect(provinces.every((p) => /^\d{2}$/.test(p.code))).toBe(true);
    });

    it('lists districts by Thai name, English name or province code', async () => {
        const byThai = await getDistricts('เชียงใหม่');
        const byEnglish = await getDistricts('Chiang Mai');
        const byCode = await getDistricts('50');

        expect(byThai).toHaveLength(25);
        expect(byEnglish).toEqual(byThai);
        expect(byCode).toEqual(byThai);
        // codes are well-formed and nest under the province (a few may be
        // blank — see the geo-mode characterisation test)
        expect(byThai.every((d) => /^(\d{4})?$/.test(d.code))).toBe(true);
        expect(
            byThai.filter((d) => d.code).every((d) => d.code.startsWith('50')),
        ).toBe(true);
    });

    it('lists sub-districts by Thai name, English name or district code', async () => {
        const expected = {
            nameTh: 'ศรีภูมิ',
            nameEn: 'Si Phum',
            code: '500101',
            postalCode: '50200',
        };
        for (const key of ['เมืองเชียงใหม่', 'Mueang Chiang Mai', '5001']) {
            const subs = await getSubDistricts(key);
            expect(subs.find((s) => s.nameTh === 'ศรีภูมิ')).toEqual(expected);
        }
    });

    it('resolves a unit by its geocode, picking the level from the length', async () => {
        expect(await getByGeocode('50')).toMatchObject({
            nameTh: 'เชียงใหม่',
            nameEn: 'Chiang Mai',
        });
        expect(await getByGeocode('5001')).toMatchObject({
            nameTh: 'เมืองเชียงใหม่',
        });
        expect(await getByGeocode('500101')).toMatchObject({
            nameTh: 'ศรีภูมิ',
            postalCode: '50200',
        });
    });

    it('returns null for an unknown code or an unrecognised length', async () => {
        expect(await getByGeocode('99')).toBeNull(); // no such province
        expect(await getByGeocode('9999')).toBeNull(); // no such district
        expect(await getByGeocode('999999')).toBeNull(); // no such sub-district
        expect(await getByGeocode('12345')).toBeNull(); // 5 digits: no level
        expect(await getByGeocode('nonsense')).toBeNull();
    });
});
