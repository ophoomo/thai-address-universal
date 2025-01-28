import { IGeo } from './geo';

export type ILanguage = 'eng' | 'thai';

export interface IDatabase {
    name: ILanguage;

    load(): Promise<void>;

    getData(): IExpanded[];
    getWord(): string[];

    getGeo(): IGeo | undefined;
    setGeo(geo: IGeo | undefined): Promise<void>;
}
