import { setEngMode } from '../src/core/thai-address';
import { validateAddress } from '../src/core/validate';

beforeAll(async () => {
    await setEngMode(false);
});

describe('validateAddress', () => {
    it('accepts a fully consistent address and returns the matching row', async () => {
        const result = await validateAddress({
            province: 'เชียงใหม่',
            district: 'เมืองเชียงใหม่',
            subDistrict: 'ศรีภูมิ',
            postalCode: '50200',
        });
        expect(result.valid).toBe(true);
        expect(result.errors).toEqual({});
        expect(result.match).toMatchObject({
            province: 'เชียงใหม่',
            district: 'เมืองเชียงใหม่',
            sub_district: 'ศรีภูมิ',
            postal_code: '50200',
        });
    });

    it('validates only the fields that are provided', async () => {
        expect((await validateAddress({ province: 'ภูเก็ต' })).valid).toBe(true);
        expect((await validateAddress({ district: 'หาดใหญ่' })).valid).toBe(
            true,
        );
    });

    it('flags an unknown province', async () => {
        const result = await validateAddress({ province: 'ไม่มีจังหวัดนี้' });
        expect(result.valid).toBe(false);
        expect(result.errors.province).toMatch(/Unknown province/);
    });

    it('flags a district that is not in the given province, and names both', async () => {
        const result = await validateAddress({
            province: 'เชียงใหม่',
            district: 'หาดใหญ่',
        });
        expect(result.valid).toBe(false);
        expect(result.errors).toEqual({
            district: 'District "หาดใหญ่" is not in province "เชียงใหม่"',
        });
    });

    it('flags a postal code that does not serve the sub-district', async () => {
        const result = await validateAddress({
            province: 'เชียงใหม่',
            district: 'เมืองเชียงใหม่',
            subDistrict: 'ศรีภูมิ',
            postalCode: '10110',
        });
        expect(result.valid).toBe(false);
        expect(result.errors.postalCode).toContain('10110');
    });

    it('is case-insensitive and trims, and works against the English dataset', async () => {
        const result = await validateAddress(
            {
                province: '  chiang mai  ',
                district: 'mueang chiang mai',
                subDistrict: 'SI PHUM',
            },
            { language: 'eng' },
        );
        expect(result.valid).toBe(true);
    });

    it('returns valid:false with no errors for an empty input', async () => {
        expect(await validateAddress({})).toEqual({ valid: false, errors: {} });
    });
});
