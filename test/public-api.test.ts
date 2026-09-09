/**
 * Guards the *published* entry point (`src/index.ts`) — the exact surface a
 * consumer gets from `import ... from 'thai-address-universal'`. If a re-export
 * is dropped or a type stops being exported, this fails at compile time (via
 * the test transform) or at run time here.
 */

import type { IExpanded, IExpandedWithPoint, ILanguage } from '../src/index';
import * as api from '../src/index';

describe('public API surface', () => {
    const expectedFunctions = [
        // Core lookups
        'getDatabase',
        'getGeoMode',
        'setGeoMode',
        'getEngMode',
        'setEngMode',
        'getProvinceAll',
        'getDistrictByProvince',
        'getSubDistrictByDistrict',
        'getPostalCodeBySubDistrict',
        'searchAddressByProvince',
        'searchAddressByDistrict',
        'searchAddressBySubDistrict',
        'searchAddressByPostalCode',
        'splitAddress',
        'translateWord',
        'preload',
        // Structured directory
        'getProvinces',
        'getDistricts',
        'getSubDistricts',
        'getByGeocode',
        // Validation & formatting
        'validateAddress',
        'formatAddress',
    ] as const;

    it.each(expectedFunctions)('exports "%s" as a function', (name) => {
        expect(typeof (api as Record<string, unknown>)[name]).toBe('function');
    });

    it('does not leak unexpected named exports', () => {
        expect(Object.keys(api).sort()).toEqual([...expectedFunctions].sort());
    });

    it('exposes the documented types (compile-time contract)', async () => {
        // The annotations below are the real assertion — they only compile if
        // the types are exported from the entry point with the right shape.
        const lang: ILanguage = 'thai';
        const rows: IExpanded[] = await api.searchAddressBySubDistrict(
            'ลุมพินี',
            1,
        );
        const scored: IExpandedWithPoint = { ...rows[0], point: 3 };

        expect(lang).toBe('thai');
        expect(scored.point).toBe(3);
        expect(scored).toEqual(
            expect.objectContaining({
                province: expect.any(String),
                district: expect.any(String),
                sub_district: expect.any(String),
                postal_code: expect.any(String),
            }),
        );
    });
});
