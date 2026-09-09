/**
 * English-mode usage: an international-facing form that shows romanised names,
 * plus `translateWord` for TH <-> EN, and a check that flipping the language
 * back does not leak the other dataset (cache correctness).
 */
import {
    getDistrictByProvince,
    getEngMode,
    getProvinceAll,
    getSubDistrictByDistrict,
    searchAddressByProvince,
    setEngMode,
    splitAddress,
    translateWord,
} from '../src/index';

afterAll(async () => {
    await setEngMode(false);
});

describe('English dataset', () => {
    beforeAll(async () => {
        await setEngMode(true);
    });

    it('reports english mode and returns 77 romanised provinces', async () => {
        expect(getEngMode()).toBe(true);
        const provinces = await getProvinceAll();
        expect(provinces).toHaveLength(77);
        expect(provinces).toEqual(
            expect.arrayContaining(['Bangkok', 'Chiang Mai', 'Phuket']),
        );
        expect(provinces.every((p) => /^[A-Za-z .'-]+$/.test(p))).toBe(true);
    });

    it('cascades in english', async () => {
        expect(await getDistrictByProvince('Phuket')).toEqual(
            expect.arrayContaining(['Kathu', 'Thalang', 'Mueang Phuket']),
        );
        expect(await getSubDistrictByDistrict('Mueang Phuket')).toEqual(
            expect.arrayContaining(['Talat Yai', 'Ratsada', 'Wichit']),
        );
    });

    it('autocompletes romanised input', async () => {
        const results = await searchAddressByProvince('chiang');
        expect(results.length).toBeGreaterThan(0);
        expect(
            results.every((r) => r.province.toLowerCase().includes('chiang')),
        ).toBe(true);
    });

    it('splits a romanised address (and disambiguates the sub-district)', async () => {
        const result = await splitAddress(
            '1 Rama I Rd Lumpini Pathum Wan Bangkok 10330',
        );
        expect(result).toMatchObject({
            sub_district: 'Lumpini',
            district: 'Pathum Wan',
            province: 'Bangkok',
            postal_code: '10330',
        });
    });
});

describe('translateWord', () => {
    beforeAll(async () => {
        await setEngMode(false);
    });

    it.each([
        ['สระบุรี', 'Saraburi'],
        ['เชียงใหม่', 'Chiang Mai'],
        ['ภูเก็ต', 'Phuket'],
    ])('translates %s -> %s and back', async (thai, eng) => {
        expect(await translateWord(thai)).toBe(eng);
        expect(await translateWord(eng)).toBe(thai);
    });

    it('returns the input unchanged when there is no match', async () => {
        expect(await translateWord('คำที่ไม่มีในฐานข้อมูล')).toBe('คำที่ไม่มีในฐานข้อมูล');
    });

    it('returns an empty string for empty input', async () => {
        expect(await translateWord('')).toBe('');
    });
});

describe('switching language back and forth', () => {
    it('serves the right dataset after each switch (no cache leak)', async () => {
        await setEngMode(true);
        expect(await getProvinceAll()).toContain('Nonthaburi');
        expect(await getProvinceAll()).not.toContain('นนทบุรี');

        await setEngMode(false);
        expect(await getProvinceAll()).toContain('นนทบุรี');
        expect(await getProvinceAll()).not.toContain('Nonthaburi');

        // districts must follow the active language too
        expect(await getDistrictByProvince('นนทบุรี')).toContain('บางกรวย');
        await setEngMode(true);
        expect(await getDistrictByProvince('Nonthaburi')).toContain(
            'Bang Kruai',
        );
    });
});
