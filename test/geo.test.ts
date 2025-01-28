import {
    getGeoMode,
    searchAddressByProvince,
    setEngMode,
    setGeoMode,
} from '../src/core/thai-address';

setEngMode(true);
describe('GeoMode Function', () => {
    it('should return true when GeoMode is enabled', async () => {
        await setGeoMode(true);
        expect(getGeoMode()).toBe(true);
    });

    it('should return false when GeoMode is disabled', async () => {
        await setGeoMode(false);
        expect(getGeoMode()).toBe(false);
    });
});

describe('searchAddressByProvince with Thai language and GeoMode enabled', () => {
    it('should return 20 addresses with valid province, district, and sub-district codes for "สระบุรี"', async () => {
        await setEngMode(false);
        await setGeoMode(true);
        const result = await searchAddressByProvince('สระบุรี');
        expect(result.length).toBe(20);
        expect(result[0].province_code).not.toBe('');
        expect(result[0].district_code).not.toBe('');
        expect(result[0].sub_district_code).not.toBe('');
    });
});

describe('searchAddressByProvince with English language and GeoMode enabled', () => {
    it('should return 20 addresses with valid province, district, and sub-district codes for "Saraburi"', async () => {
        await setGeoMode(true);
        await setEngMode(true);
        const result = await searchAddressByProvince('Saraburi');
        expect(result.length).toBe(20);
        expect(result[0].province_code).not.toBe('');
        expect(result[0].district_code).not.toBe('');
        expect(result[0].sub_district_code).not.toBe('');
    });
});
