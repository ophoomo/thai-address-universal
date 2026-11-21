/**
 * Regression: the search cache must not outlive a geo-mode toggle. The same
 * query, repeated after `setGeoMode`, has to reflect the new mode — gaining
 * the geocode columns when it is turned on and losing them when turned off.
 */
import {
    searchAddressBySubDistrict,
    setEngMode,
    setGeoMode,
} from '../src/index';

beforeAll(async () => {
    await setEngMode(false);
    await setGeoMode(false);
});

afterAll(async () => {
    await setGeoMode(false);
});

const firstRow = async () => (await searchAddressBySubDistrict('ศรีภูมิ', 1))[0];

describe('search cache across geo-mode toggles', () => {
    it('serves fresh rows after geo mode is turned on, then off again', async () => {
        const plain = await firstRow();
        expect(plain.sub_district_code).toBeUndefined();

        await setGeoMode(true);
        const coded = await firstRow();
        expect(coded.sub_district_code).toMatch(/^\d{6}$/);
        expect(coded.province_code).toMatch(/^\d{2}$/);

        await setGeoMode(false);
        const plainAgain = await firstRow();
        expect(plainAgain.sub_district_code).toBeUndefined();
        expect(plainAgain.province_code).toBeUndefined();
    });
});
