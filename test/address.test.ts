import { Address } from '../src/core/address';
import { IDatabase } from '../src/types/database';

describe('Address Class - Cache Logic', () => {
    let address: Address;
    let mockDatabase: IDatabase;
    const mockData = [
        {
            province: 'Bangkok',
            district: 'Pathum Wan',
            sub_district: 'Lumphini',
            postal_code: '10330',
        },
        {
            province: 'Bangkok',
            district: 'Sathon',
            sub_district: 'Thung Maha Mek',
            postal_code: '10120',
        },
        {
            province: 'Chiang Mai',
            district: 'Mueang Chiang Mai',
            sub_district: 'Si Phum',
            postal_code: '50200',
        },
    ];

    beforeEach(() => {
        mockDatabase = {
            name: 'thai',
            getData: jest.fn(() => mockData),
            getWord: jest.fn(() => []),
            getGeo: jest.fn(() => undefined),
            load: jest.fn(),
            setGeo: jest.fn(),
        } as unknown as IDatabase;

        address = new Address(mockDatabase);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('getProvinceAll', () => {
        it('should return all unique provinces on first call', () => {
            const provinces = address.getProvinceAll();
            expect(provinces).toContain('Bangkok');
            expect(provinces).toContain('Chiang Mai');
            expect(provinces.length).toBe(2);
        });

        it('should return cached result on second call', () => {
            address.getProvinceAll();
            const spyGetData = jest.spyOn(mockDatabase, 'getData');

            address.getProvinceAll();

            // getData should only be called once (cached)
            expect(spyGetData).toHaveBeenCalledTimes(1);
        });
    });

    describe('getDistrictByProvince', () => {
        it('should return districts for given province', () => {
            const districts = address.getDistrictByProvince('Bangkok');
            expect(districts).toContain('Pathum Wan');
            expect(districts).toContain('Sathon');
            expect(districts.length).toBe(2);
        });

        it('should return empty array for non-existent province', () => {
            const districts = address.getDistrictByProvince('NonExistent');
            expect(districts.length).toBe(0);
        });

        it('should return cached result on repeated calls', () => {
            address.getDistrictByProvince('Bangkok');
            const spyGetData = jest.spyOn(mockDatabase, 'getData');

            address.getDistrictByProvince('Bangkok');

            expect(spyGetData).toHaveBeenCalledTimes(1);
        });
    });

    describe('getSubDistrictByDistrict', () => {
        it('should return sub-districts for given district', () => {
            const subDistricts = address.getSubDistrictByDistrict('Pathum Wan');
            expect(subDistricts).toContain('Lumphini');
            expect(subDistricts.length).toBe(1);
        });

        it('should return empty array for non-existent district', () => {
            const subDistricts =
                address.getSubDistrictByDistrict('NonExistent');
            expect(subDistricts.length).toBe(0);
        });

        it('should return cached result on repeated calls', () => {
            address.getSubDistrictByDistrict('Pathum Wan');
            const spyGetData = jest.spyOn(mockDatabase, 'getData');

            address.getSubDistrictByDistrict('Pathum Wan');

            expect(spyGetData).toHaveBeenCalledTimes(1);
        });
    });

    describe('getPostalCodeBySubDistrict', () => {
        it('should return postal codes for given sub-district', () => {
            const postalCodes = address.getPostalCodeBySubDistrict('Lumphini');
            expect(postalCodes).toContain('10330');
            expect(postalCodes.length).toBe(1);
        });

        it('should return empty array for non-existent sub-district', () => {
            const postalCodes =
                address.getPostalCodeBySubDistrict('NonExistent');
            expect(postalCodes.length).toBe(0);
        });

        it('should return cached result on repeated calls', () => {
            address.getPostalCodeBySubDistrict('Lumphini');
            const spyGetData = jest.spyOn(mockDatabase, 'getData');

            address.getPostalCodeBySubDistrict('Lumphini');

            expect(spyGetData).toHaveBeenCalledTimes(1);
        });
    });

    describe('setDatabase - cache clearing', () => {
        it('should clear cache when switching to different database language', () => {
            address.getProvinceAll();

            const newMockDatabase = {
                name: 'eng',
                getData: jest.fn(() => mockData),
                getWord: jest.fn(() => []),
                getGeo: jest.fn(() => undefined),
                load: jest.fn(),
                setGeo: jest.fn(),
            } as unknown as IDatabase;

            address.setDatabase(newMockDatabase);
            const spyGetData = jest.spyOn(newMockDatabase, 'getData');

            address.getProvinceAll();

            // Should fetch from new database, not use old cache
            expect(spyGetData).toHaveBeenCalled();
        });

        it('should not clear cache when switching to same database language', () => {
            address.getProvinceAll();

            const sameMockDatabase = {
                name: 'thai',
                getData: jest.fn(() => mockData),
                getWord: jest.fn(() => []),
                getGeo: jest.fn(() => undefined),
                load: jest.fn(),
                setGeo: jest.fn(),
            } as unknown as IDatabase;

            address.setDatabase(sameMockDatabase);
            const spyGetData = jest.spyOn(sameMockDatabase, 'getData');

            address.getProvinceAll();

            // Should not call getData since cache is still valid
            expect(spyGetData).not.toHaveBeenCalled();
        });
    });
});
