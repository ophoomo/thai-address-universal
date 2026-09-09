import type { IDatabase } from './database';
import type { IExpanded } from './thai-address';

export interface ISearch {
    splitAddress(fullAddress: string): IExpanded | null;
    setDatabase(database: IDatabase): void;
    searchAddressByProvince(searchStr: string, maxResult?: number): IExpanded[];
    searchAddressByDistrict(searchStr: string, maxResult?: number): IExpanded[];
    searchAddressBySubDistrict(
        searchStr: string | number,
        maxResult?: number,
    ): IExpanded[];
    searchAddressByPostalCode(
        searchStr: string | number,
        maxResult?: number,
    ): IExpanded[];

    resolveResultbyField(
        type: keyof IExpanded,
        searchStr: string | number,
        maxResult?: number,
    ): IExpanded[];
}
