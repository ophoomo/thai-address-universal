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
        try {
            if (this.words.length === 0) {
                await this.loadWord();
            }
            this.data = preprocess(
                ThaiAddressDB as IProvince[],
                this.words,
                this.geo?.getData(),
            );
        } catch (error) {
            console.error('Error loading database:', error);
            this.data = [];
            this.words = [];
        }
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
    private static instances: Map<string, IDatabase> = new Map();
    private static geo: IGeo | null = null;

    /**
     * Creates a new database instance based on the language
     * @param language ILanguage - The language of the database ('thai' or 'eng')
     * @returns Promise<IDatabase>
     */
    static async createDatabase(language: ILanguage): Promise<IDatabase> {
        const cachedInstance = DatabaseFactory.instances.get(language);
        if (cachedInstance) {
            return cachedInstance;
        }

        try {
            const instance =
                language === 'thai' ? new ThaiDatabase() : new EngDatabase();

            if (this.geo !== null) {
                await instance.setGeo(this.geo);
            } else {
                await instance.load();
            }

            DatabaseFactory.instances.set(language, instance);
            return instance;
        } catch (error) {
            console.error(`Error creating ${language} database:`, error);
            throw error;
        }
    }

    /**
     * Sets geo data for all existing database instances
     * @param geo IGeo - The geo data to be set
     */
    static createGeo(geo: IGeo): void {
        this.geo = geo;
        for (const instance of DatabaseFactory.instances.values()) {
            instance.setGeo(geo).catch((error) => {
                console.error('Error setting geo data:', error);
            });
        }
    }

    /**
     * Clears geo data from all database instances
     */
    static clearGeo(): void {
        this.geo = null;
        for (const instance of DatabaseFactory.instances.values()) {
            instance.setGeo(undefined).catch((error) => {
                console.error('Error clearing geo data:', error);
            });
        }
    }

    /**
     * Clears all database instances
     */
    static clearInstances(): void {
        DatabaseFactory.instances.clear();
    }
}
