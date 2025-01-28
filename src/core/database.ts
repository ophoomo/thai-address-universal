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

    /**
     * Returns the processed data
     * @returns IExpanded[]
     */
    public getData(): IExpanded[] {
        return this.data;
    }

    /**
     * Returns the words used for processing
     * @returns string[]
     */
    public getWord(): string[] {
        return this.words;
    }

    /**
     * Returns geo data, if available
     * @returns IGeo | undefined
     */
    public getGeo(): IGeo | undefined {
        return this.geo;
    }

    /**
     * Sets the geo data and reloads the database
     * @param geo IGeo - Geo data
     */
    public async setGeo(geo: IGeo): Promise<void> {
        this.geo = geo;
        await this.load();
    }

    /**
     * Loads data into the database by preprocessing it
     * If words are not loaded, loads them first
     */
    public async load(): Promise<void> {
        if (this.words.length === 0) await this.loadWord();
        this.data = preprocess(
            ThaiAddressDB as IProvince[],
            this.words,
            this.geo?.getData(),
        );
    }

    /**
     * Placeholder method for loading words (implemented in subclasses)
     */
    protected async loadWord() {}
}

export class ThaiDatabase extends Database {
    public name: ILanguage = 'thai';

    /**
     * Loads words specific to the Thai language
     */
    protected override async loadWord() {
        const rawData = await import('../../migrate/output/th_db.json');
        this.words = preprocess_word(rawData);
    }
}

export class EngDatabase extends Database {
    public name: ILanguage = 'eng';

    /**
     * Loads words specific to the English language
     */
    protected override async loadWord() {
        const rawData = await import('../../migrate/output/en_db.json');
        this.words = preprocess_word(rawData, true);
    }
}

export class DatabaseFactory {
    private static instances: { [key: string]: IDatabase } = {};
    private static geo: IGeo | null = null;

    /**
     * Creates a new database instance based on the language
     * @param language ILanguage - The language of the database ('thai' or 'eng')
     * @returns Promise<IDatabase>
     */
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

    /**
     * Sets geo data for all existing database instances
     * @param geo IGeo - The geo data to be set
     */
    static createGeo(geo: IGeo) {
        this.geo = geo;
        for (const key in DatabaseFactory.instances) {
            DatabaseFactory.instances[key].setGeo(geo);
        }
    }

    /**
     * Clears geo data from all database instances
     */
    static clearGeo() {
        this.geo = null;
        for (const key in DatabaseFactory.instances) {
            DatabaseFactory.instances[key].setGeo(undefined);
        }
    }

    /**
     * Clears all database instances
     */
    static clearInstances() {
        DatabaseFactory.instances = {};
    }
}
