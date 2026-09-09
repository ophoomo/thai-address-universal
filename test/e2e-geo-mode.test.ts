/**
 * Geo mode: opting in enriches every row with the official province /
 * district / sub-district numeric codes (2 / 4 / 6 digits). Opting back out
 * strips them again.
 */
import {
    getDatabase,
    getGeoMode,
    getProvinceAll,
    searchAddressBySubDistrict,
    setEngMode,
    setGeoMode,
} from '../src/index';

beforeAll(async () => {
    await setEngMode(false);
});

afterAll(async () => {
    await setGeoMode(false);
});

describe('geo mode', () => {
    it('is off by default and rows carry no codes', async () => {
        expect(getGeoMode()).toBe(false);
        await getProvinceAll();
        const row = getDatabase()[0];
        expect(row.province_code).toBeUndefined();
        expect(row.district_code).toBeUndefined();
        expect(row.sub_district_code).toBeUndefined();
    });

    it('enabling it adds well-formed codes to every row', async () => {
        await setGeoMode(true);
        expect(getGeoMode()).toBe(true);

        const db = getDatabase();
        expect(db.length).toBeGreaterThan(7000);

        let fullyCoded = 0;
        for (const row of db) {
            // every code is either well-formed or empty (uninhabited islands)
            expect(row.province_code).toMatch(/^(\d{2})?$/);
            expect(row.district_code).toMatch(/^(\d{4})?$/);
            expect(row.sub_district_code).toMatch(/^(\d{6})?$/);
            if (row.province_code && row.district_code) {
                // district code always nests under the province code
                expect(row.district_code.startsWith(row.province_code)).toBe(
                    true,
                );
            }
            if (
                row.province_code &&
                row.district_code &&
                row.sub_district_code
            ) {
                fullyCoded++;
            }
        }
        // the overwhelming majority of rows are fully coded
        expect(fullyCoded / db.length).toBeGreaterThan(0.95);
    });

    it('never leaves province/district code empty when the sub-district code is present', async () => {
        // A few geo source entries have a boolean (not a number) in the
        // district slot; preprocess() now backfills province_code /
        // district_code from the 6-digit sub-district code instead of "".
        await setGeoMode(true);
        const withSubCode = getDatabase().filter(
            (r) => r.sub_district_code && r.sub_district_code.length === 6,
        );
        expect(withSubCode.length).toBeGreaterThan(7000);
        for (const row of withSubCode) {
            expect(row.province_code).toMatch(/^\d{2}$/);
            expect(row.district_code).toMatch(/^\d{4}$/);
        }
    });

    it('CHARACTERISATION: ~15% of sub-district codes have a wrong district prefix (upstream geo.json data)', async () => {
        // NOT a bug in preprocess() — the walk consumes migrate/output/geo.json
        // exactly (0 leftover entries). The upstream geocode table itself
        // assigns ~1.1k tambon codes a district prefix that disagrees with the
        // tambon's district. A real fix means regenerating geo.json from an
        // authoritative source. Pinned so that regen shows up as a diff here.
        await setGeoMode(true);
        const db = getDatabase();
        const withBoth = db.filter(
            (r) =>
                r.sub_district_code &&
                r.sub_district_code.length === 6 &&
                r.district_code &&
                r.district_code.length === 4,
        );
        const consistentPrefix = withBoth.filter((r) =>
            r.sub_district_code!.startsWith(r.district_code!),
        );
        // every district code still nests correctly under its province code
        expect(
            withBoth.every((r) =>
                r.district_code!.startsWith(r.province_code!),
            ),
        ).toBe(true);
        // but the sub-district <- district link is only ~85%
        const ratio = consistentPrefix.length / withBoth.length;
        expect(ratio).toBeGreaterThan(0.82);
        expect(ratio).toBeLessThan(0.9);
    });

    it('exposes the codes through search results too', async () => {
        await setGeoMode(true);
        const hits = await searchAddressBySubDistrict('ศรีภูมิ');
        const chiangMai = hits.find((r) => r.province === 'เชียงใหม่');
        expect(chiangMai).toMatchObject({
            district: 'เมืองเชียงใหม่',
            sub_district: 'ศรีภูมิ',
            province_code: '50',
            district_code: '5001',
            sub_district_code: '500101',
        });
    });

    it('disabling it removes the codes again', async () => {
        await setGeoMode(true);
        await setGeoMode(false);
        expect(getGeoMode()).toBe(false);
        const row = getDatabase().find((r) => r.sub_district === 'ศรีภูมิ');
        expect(row).toBeDefined();
        expect(row!.province_code).toBeUndefined();
        expect(row!.sub_district_code).toBeUndefined();
    });
});
