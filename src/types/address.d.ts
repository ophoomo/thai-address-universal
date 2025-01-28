import { IDatabase } from './database';

export interface IAddress {
    setDatabase(database: IDatabase): void;
    getProvinceAll(): string[];
    getDistrictByProvince(province: string): string[];
    getSubDistrictByDistrict(district: string): string[];
    getPostalCodeBySubDistrict(sub_district: string): string[];
}
