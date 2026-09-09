/**
 * Real-world `splitAddress` parsing: the kind of free-text a user pastes into
 * a single "address" box, in the formats Thai addresses are actually written
 * (full words, ต./อ./จ. abbreviations, no prefixes at all, Bangkok wording).
 */
import {
    getDatabase,
    getProvinceAll,
    setEngMode,
    splitAddress,
} from '../src/index';

beforeAll(async () => {
    await setEngMode(false);
});

describe('splitAddress — formats seen in the wild', () => {
    it('parses a full-word up-country address', async () => {
        const input = '99/9 หมู่ 5 ตำบลศรีภูมิ อำเภอเมืองเชียงใหม่ จังหวัดเชียงใหม่ 50200';
        expect(await splitAddress(input)).toEqual({
            address: '99/9 หมู่ 5',
            sub_district: 'ศรีภูมิ',
            district: 'เมืองเชียงใหม่',
            province: 'เชียงใหม่',
            postal_code: '50200',
        });
    });

    it('parses the ต./อ./จ. abbreviation style', async () => {
        const input = '9 หมู่ 1 ต.ตลาดใหญ่ อ.เมืองภูเก็ต จ.ภูเก็ต 83000';
        expect(await splitAddress(input)).toEqual({
            address: '9 หมู่ 1',
            sub_district: 'ตลาดใหญ่',
            district: 'เมืองภูเก็ต',
            province: 'ภูเก็ต',
            postal_code: '83000',
        });
    });

    it('parses an address with no prefixes at all', async () => {
        const input = '55 ม.3 บางกรวย บางกรวย นนทบุรี 11130';
        expect(await splitAddress(input)).toEqual({
            address: '55 ม.3',
            sub_district: 'บางกรวย',
            district: 'บางกรวย',
            province: 'นนทบุรี',
            postal_code: '11130',
        });
    });

    it('accepts a trailing "Thailand" and extra whitespace', async () => {
        const input =
            '126/548 ถ.สุขาประชาสรรค์  ปากเกร็ด ปากเกร็ด นนทบุรี Thailand 11120';
        const result = await splitAddress(input);
        expect(result).toMatchObject({
            sub_district: 'ปากเกร็ด',
            district: 'ปากเกร็ด',
            province: 'นนทบุรี',
            postal_code: '11120',
        });
        expect(result?.address).not.toMatch(/Thailand/);
    });

    it('picks the sub-district that is actually written, not its same-named district', async () => {
        // Regression: "แขวงลุมพินี เขตปทุมวัน" — อำเภอปทุมวัน also has a
        // ตำบลปทุมวัน, so a plain substring match scored both rows 3/3 and the
        // wrong (district-named) one used to win.
        expect(
            await splitAddress(
                '1 ถนนพระราม 1 แขวงลุมพินี เขตปทุมวัน กรุงเทพมหานคร 10330',
            ),
        ).toEqual({
            address: '1 ถนนพระราม 1',
            sub_district: 'ลุมพินี',
            district: 'ปทุมวัน',
            province: 'กรุงเทพมหานคร',
            postal_code: '10330',
        });

        // Same shape up-country: อำเภอชนบท / ตำบลชนบท vs ตำบลบ้านแท่น
        expect(
            await splitAddress('88 หมู่ 2 บ้านแท่น ชนบท ขอนแก่น 40180'),
        ).toMatchObject({ sub_district: 'บ้านแท่น', district: 'ชนบท' });
    });

    it('still resolves a legitimately same-named tambon+amphoe', async () => {
        // ตำบลบางกรวย really is in อำเภอบางกรวย — must not be "disambiguated" away.
        expect(
            await splitAddress('55 ม.3 บางกรวย บางกรวย นนทบุรี 11130'),
        ).toMatchObject({ sub_district: 'บางกรวย', district: 'บางกรวย' });
    });

    it('does not double-expand an already-written "กรุงเทพมหานคร"', async () => {
        // Regression: prepareAddress turned "กรุงเทพมหานคร" into
        // "กรุงเทพมหานครมหานคร", leaving "มหานคร" stuck in the remainder.
        const result = await splitAddress(
            '1 ถนนพระราม 1 แขวงลุมพินี เขตปทุมวัน กรุงเทพมหานคร 10330',
        );
        expect(result?.address).not.toMatch(/มหานคร/);
    });

    it('does not mutate the input string', async () => {
        const input = '9 หมู่ 1 ต.ตลาดใหญ่ อ.เมืองภูเก็ต จ.ภูเก็ต 83000';
        const copy = `${input}`;
        await splitAddress(input);
        expect(input).toBe(copy);
    });

    it('recovers province + district + postal from a spread-out sample of real rows', async () => {
        await getProvinceAll();
        const db = getDatabase();
        const step = Math.floor(db.length / 40);

        let attempted = 0;
        let coreOk = 0; // province + district + postal all correct
        let subDistrictOk = 0; // sub-district ALSO correct
        for (let i = 0; i < db.length; i += step) {
            const row = db[i];
            if (!row.postal_code) continue; // skip uninhabited islands
            attempted++;
            const full = `1/1 ${row.sub_district} ${row.district} ${row.province} ${row.postal_code}`;
            const parsed = await splitAddress(full);
            if (!parsed) continue; // postal code with >20 candidate rows: matcher can't see the target

            if (
                parsed.postal_code === row.postal_code &&
                parsed.province === row.province &&
                parsed.district === row.district
            ) {
                coreOk++;
                if (parsed.sub_district === row.sub_district) subDistrictOk++;
            }
        }

        // province / district / postal must be essentially always recoverable
        expect(coreOk / attempted).toBeGreaterThan(0.98);
        // and so is the sub-district now that ties are broken sensibly
        expect(subDistrictOk / coreOk).toBeGreaterThan(0.95);
    });
});

describe('splitAddress — returns null when it cannot be sure', () => {
    it('has no postal code', async () => {
        expect(
            await splitAddress('126/548 ถ.สุขาประชาสรรค์ ปากเกร็ด นนทบุรี'),
        ).toBeNull();
    });

    it('has a postal code but the other parts do not corroborate it', async () => {
        expect(
            await splitAddress('126/548 ถ.สุขาประชาสรรค์ ไม่มีที่นี่ 11120'),
        ).toBeNull();
    });
});
