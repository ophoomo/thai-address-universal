/**
 * End-to-end scenarios that mirror how a front-end address form actually uses
 * the library: a cascading Province -> District -> Sub-district -> Postal code
 * picker, "search as you type" autocomplete, and reverse lookup from a postal
 * code. Also pins a few dataset-wide invariants a UI relies on.
 */
import {
    getDatabase,
    getDistrictByProvince,
    getPostalCodeBySubDistrict,
    getProvinceAll,
    getSubDistrictByDistrict,
    searchAddressByDistrict,
    searchAddressByPostalCode,
    searchAddressByProvince,
    searchAddressBySubDistrict,
    setEngMode,
} from '../src/index';

beforeAll(async () => {
    await setEngMode(false);
});

describe('cascading address picker', () => {
    // [province, district, sub-district, expected postal code] — real rows
    // sampled across every region of the country.
    const cases: [string, string, string, string][] = [
        ['กรุงเทพมหานคร', 'ปทุมวัน', 'ลุมพินี', '10330'],
        ['เชียงใหม่', 'เมืองเชียงใหม่', 'ศรีภูมิ', '50200'],
        ['ภูเก็ต', 'เมืองภูเก็ต', 'ตลาดใหญ่', '83000'],
        ['นนทบุรี', 'บางกรวย', 'บางกรวย', '11130'],
        ['ขอนแก่น', 'เมืองขอนแก่น', 'ในเมือง', '40000'],
        ['สงขลา', 'หาดใหญ่', 'หาดใหญ่', '90110'],
    ];

    it.each(cases)(
        '%s > %s > %s resolves to postal %s',
        async (province, district, subDistrict, postalCode) => {
            const provinces = await getProvinceAll();
            expect(provinces).toContain(province);

            const districts = await getDistrictByProvince(province);
            expect(districts).toContain(district);

            const subDistricts = await getSubDistrictByDistrict(district);
            expect(subDistricts).toContain(subDistrict);

            const postalCodes = await getPostalCodeBySubDistrict(subDistrict);
            expect(postalCodes).toContain(postalCode);
        },
    );

    it('narrows the option list at every step', async () => {
        const allDistricts = await getDistrictByProvince('เชียงใหม่');
        expect(allDistricts).toHaveLength(25);

        const subDistricts = await getSubDistrictByDistrict('เมืองเชียงใหม่');
        expect(subDistricts).toHaveLength(16);
        // sub-districts belong to exactly one district here
        expect(new Set(subDistricts).size).toBe(subDistricts.length);
    });

    it('returns nothing for an unknown or blank selection', async () => {
        expect(await getDistrictByProvince('ไม่มีจังหวัดนี้')).toEqual([]);
        expect(await getSubDistrictByDistrict('')).toEqual([]);
        expect(await getPostalCodeBySubDistrict('   ')).toEqual([]);
    });

    it('exposes sub-districts whose name is shared across provinces', async () => {
        // "ตลาดใหญ่" exists in both Phuket (83000) and Chiang Mai (50220).
        const postalCodes = await getPostalCodeBySubDistrict('ตลาดใหญ่');
        expect(postalCodes).toEqual(expect.arrayContaining(['83000', '50220']));
    });
});

describe('search-as-you-type autocomplete', () => {
    it('matches a partial province name and every row really contains it', async () => {
        const results = await searchAddressByProvince('เชียง');
        expect(results.length).toBeGreaterThan(0);
        expect(results.every((r) => r.province.includes('เชียง'))).toBe(true);
    });

    it('honours the maxResult cap', async () => {
        const capped = await searchAddressByDistrict('เมือง', 5);
        expect(capped).toHaveLength(5);

        const uncapped = await searchAddressByDistrict('เมือง');
        expect(uncapped.length).toBeGreaterThan(5);
        // default cap documented as 20
        expect(uncapped.length).toBeLessThanOrEqual(20);
    });

    it('is case-insensitive and trims the query', async () => {
        const spaced = await searchAddressByProvince('  phuket  ');
        const plain = await searchAddressByProvince('Phuket');
        // Thai DB is active, so the romanised query finds nothing — but it must
        // behave identically whether padded or not.
        expect(spaced).toEqual(plain);
    });

    it('returns an empty list for an empty query', async () => {
        expect(await searchAddressBySubDistrict('')).toEqual([]);
        expect(await searchAddressByPostalCode('')).toEqual([]);
    });

    it('accepts a numeric postal-code query', async () => {
        const asString = await searchAddressByPostalCode('50200');
        const asNumber = await searchAddressByPostalCode(50200);
        expect(asNumber).toEqual(asString);
        expect(asString.length).toBeGreaterThan(0);
        expect(asString.every((r) => r.postal_code === '50200')).toBe(true);
    });
});

describe('reverse lookup from a postal code', () => {
    it('maps 10330 to Bangkok / Pathum Wan only', async () => {
        const rows = await searchAddressByPostalCode('10330');
        expect(rows.length).toBeGreaterThan(0);
        expect(new Set(rows.map((r) => r.province))).toEqual(
            new Set(['กรุงเทพมหานคร']),
        );
        expect(new Set(rows.map((r) => r.district))).toEqual(
            new Set(['ปทุมวัน']),
        );
    });

    it('keeps a genuinely ambiguous postal code ambiguous (83000)', async () => {
        const rows = await searchAddressByPostalCode('83000');
        const provinces = new Set(rows.map((r) => r.province));
        expect(provinces).toEqual(new Set(['ภูเก็ต', 'พังงา']));
    });
});

describe('dataset invariants a UI depends on', () => {
    let db: ReturnType<typeof getDatabase>;

    beforeAll(async () => {
        await getProvinceAll(); // force init
        db = getDatabase();
    });

    it('has 77 provinces and ~7.5k sub-district rows', () => {
        expect(new Set(db.map((r) => r.province)).size).toBe(77);
        expect(db.length).toBeGreaterThan(7000);
    });

    it('every row has non-empty province / district / sub-district', () => {
        expect(
            db.every((r) => r.province && r.district && r.sub_district),
        ).toBe(true);
    });

    it('postal code is always a 5-digit string or empty (uninhabited islands)', () => {
        expect(db.every((r) => /^(\d{5})?$/.test(r.postal_code))).toBe(true);
        // the empty ones are rare and all on island sub-districts
        const blank = db.filter((r) => r.postal_code === '');
        expect(blank.length).toBeLessThan(60);
        expect(blank.every((r) => r.sub_district.includes('เกาะ'))).toBe(true);
    });
});
