import { Address } from '../src/core/address';
import type { IDatabase } from '../src/types/database';
import type { IExpanded } from '../src/types/thai-address';

const makeDatabase = (name: IDatabase['name'], rows: IExpanded[]): IDatabase =>
    ({
        name,
        getData: jest.fn(() => rows),
        getWord: jest.fn(() => []),
        getGeo: jest.fn(() => undefined),
        load: jest.fn(),
        setGeo: jest.fn(),
    }) as unknown as IDatabase;

const ROW: IExpanded = {
    province: 'A',
    district: 'B',
    sub_district: 'C',
    postal_code: '10000',
};

describe('Address', () => {
    it('returns an empty array for every level when the dataset is empty', () => {
        const address = new Address(makeDatabase('thai', []));
        expect(address.getProvinceAll()).toEqual([]);
        expect(address.getDistrictByProvince('X')).toEqual([]);
        expect(address.getSubDistrictByDistrict('X')).toEqual([]);
        expect(address.getPostalCodeBySubDistrict('X')).toEqual([]);
    });

    it('deduplicates values and narrows by the parent', () => {
        const address = new Address(
            makeDatabase('thai', [
                ROW,
                { ...ROW, sub_district: 'C2' },
                { ...ROW, province: 'A2', district: 'B2', sub_district: 'C3' },
            ]),
        );
        expect(address.getProvinceAll()).toEqual(['A', 'A2']);
        expect(address.getDistrictByProvince('A')).toEqual(['B']);
        expect(address.getSubDistrictByDistrict('B')).toEqual(['C', 'C2']);
        expect(address.getPostalCodeBySubDistrict('C')).toEqual(['10000']);
    });

    it('memoises each distinct list until the dataset changes', () => {
        const db = makeDatabase('thai', [ROW]);
        const address = new Address(db);

        const first = address.getProvinceAll();
        expect(address.getProvinceAll()).toBe(first); // same reference => cached
        expect(db.getData).toHaveBeenCalledTimes(1);

        // Same language: cache is kept.
        address.setDatabase(makeDatabase('thai', [ROW]));
        expect(address.getProvinceAll()).toBe(first);

        // Different language: cache is dropped and recomputed.
        address.setDatabase(makeDatabase('eng', [{ ...ROW, province: 'Z' }]));
        const afterSwitch = address.getProvinceAll();
        expect(afterSwitch).not.toBe(first);
        expect(afterSwitch).toEqual(['Z']);
    });
});
