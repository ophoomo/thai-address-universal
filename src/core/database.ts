import ThaiAddressTree from '../../migrate/output/db.json';
import { LANGUAGE } from '../constants';
import type { IDatabase, ILanguage } from '../types/database';
import type { IGeo } from '../types/geo';
import type { IProvince } from '../types/preprocess';
import type { IExpanded } from '../types/thai-address';
import { preprocess, preprocess_word } from '../utils/preprocess';

/**
 * One language's dataset. The province → district → sub-district tree is
 * shared by both languages (`ThaiAddressTree`); only the word table differs,
 * and it is fetched lazily by the language-specific subclasses.
 */
abstract class Database implements IDatabase {
    public abstract readonly name: ILanguage;

    protected rows: IExpanded[] = [];
    protected words: string[] = [];
    protected geo?: IGeo;

    public getData(): IExpanded[] {
        return this.rows;
    }

    public getWord(): string[] {
        return this.words;
    }

    public getGeo(): IGeo | undefined {
        return this.geo;
    }

    public async setGeo(geo: IGeo | undefined): Promise<void> {
        this.geo = geo;
        await this.load();
    }

    /** Decodes the shared tree with this language's words (and geo overlay). */
    public async load(): Promise<void> {
        try {
            if (this.words.length === 0) {
                this.words = await this.loadWords();
            }
            this.rows = preprocess(
                ThaiAddressTree as IProvince[],
                this.words,
                this.geo?.getData(),
            );
        } catch (error) {
            console.error('Error loading database:', error);
            this.rows = [];
            this.words = [];
        }
    }

    /** Fetches and decodes this language's word table. */
    protected abstract loadWords(): Promise<string[]>;
}

/** Thai-language dataset. */
export class ThaiDatabase extends Database {
    public readonly name = LANGUAGE.THAI;

    protected override async loadWords(): Promise<string[]> {
        const module = await import('../../migrate/output/th_db.json');
        return preprocess_word(module);
    }
}

/** English-language dataset. */
export class EngDatabase extends Database {
    public readonly name = LANGUAGE.ENGLISH;

    protected override async loadWords(): Promise<string[]> {
        const module = await import('../../migrate/output/en_db.json');
        return preprocess_word(module, true);
    }
}

/**
 * Owns the (at most two) {@link Database} instances and the shared geo overlay.
 * Instances are cached because decoding the ~7.5k rows is not free, and the
 * overlay is applied to every instance so switching languages keeps geo mode.
 */
// biome-ignore lint/complexity/noStaticOnlyClass: a single namespaced owner for the instance cache reads better than four loose module functions sharing hidden state.
export class DatabaseFactory {
    private static readonly instances = new Map<ILanguage, IDatabase>();
    private static geo: IGeo | null = null;

    /** Returns the cached dataset for `language`, building it on first request. */
    static async createDatabase(language: ILanguage): Promise<IDatabase> {
        const cached = DatabaseFactory.instances.get(language);
        if (cached) {
            return cached;
        }

        try {
            const instance =
                language === LANGUAGE.THAI
                    ? new ThaiDatabase()
                    : new EngDatabase();

            if (DatabaseFactory.geo !== null) {
                await instance.setGeo(DatabaseFactory.geo);
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

    /** Attaches `geo` to every current and future instance. */
    static createGeo(geo: IGeo): void {
        DatabaseFactory.geo = geo;
        for (const instance of DatabaseFactory.instances.values()) {
            instance.setGeo(geo).catch((error) => {
                console.error('Error setting geo data:', error);
            });
        }
    }

    /** Detaches the geo overlay from every instance. */
    static clearGeo(): void {
        DatabaseFactory.geo = null;
        for (const instance of DatabaseFactory.instances.values()) {
            instance.setGeo(undefined).catch((error) => {
                console.error('Error clearing geo data:', error);
            });
        }
    }

    /** Drops the instance cache (used by tests). */
    static clearInstances(): void {
        DatabaseFactory.instances.clear();
    }
}
