import { IDatabase, ILanguage } from '../types/database';
import { IExpanded } from '../types/thai-address';
import { preprocess, preprocess_word } from '../utils/preprocess';
import ThaiAddressDB from '../../migrate/output/db.json';
import { IProvince } from '../types/preprocess';
import { IGeo } from '../types/geo';

class Database implements IDatabase {
    public name: ILanguage = 'thai';

    protected data: IExpanded[] = [];
    protected words: string[] = [];
    protected geo?: IGeo;

    public getData(): IExpanded[] {
        return this.data;
    }

    public getWord(): string[] {
        return this.words;
    }

    public getGeo(): IGeo | undefined {
        return this.geo;
    }

    public async setGeo(geo: IGeo): Promise<void> {
        this.geo = geo;
        await this.load();
    }

    public async load(): Promise<void> {
        if (this.words.length === 0) await this.loadWord();
        this.data = preprocess(
            ThaiAddressDB as IProvince[],
            this.words,
            this.geo?.getData(),
        );
    }

    protected async loadWord() {}
}

export class ThaiDatabase extends Database {
    public name: ILanguage = 'thai';

    protected override async loadWord() {
        const rawData = await import('../../migrate/output/th_db.json');
        this.words = preprocess_word(rawData);
    }
}

export class EngDatabase extends Database {
    public name: ILanguage = 'eng';

    protected override async loadWord() {
        const rawData = await import('../../migrate/output/en_db.json');
        this.words = preprocess_word(rawData, true);
    }
}

export class DatabaseFactory {
    private static instances: { [key: string]: IDatabase } = {};
    private static geo: IGeo | null = null;

    static async createDatabase(language: ILanguage): Promise<IDatabase> {
        if (!DatabaseFactory.instances[language]) {
            if (language === 'thai') {
                DatabaseFactory.instances[language] = new ThaiDatabase();
            } else {
                DatabaseFactory.instances[language] = new EngDatabase();
            }
            if (this.geo !== null) {
                await DatabaseFactory.instances[language].setGeo(this.geo);
            } else {
                await DatabaseFactory.instances[language].load();
            }
        }
        return DatabaseFactory.instances[language];
    }

    static createGeo(geo: IGeo) {
        this.geo = geo;
        for (const key in DatabaseFactory.instances) {
            DatabaseFactory.instances[key].setGeo(geo);
        }
    }

    static clearGeo() {
        this.geo = null;
        for (const key in DatabaseFactory.instances) {
            DatabaseFactory.instances[key].setGeo(undefined);
        }
    }

    static clearInstances() {
        DatabaseFactory.instances = {};
    }
}
