import {
    DatabaseFactory,
    ThaiDatabase,
    EngDatabase,
} from '../src/core/database';
import { Geo } from '../src/core/geo';

describe('DatabaseFactory', () => {
    it('should create a ThaiDatabase instance for "thai" language', async () => {
        const db = await DatabaseFactory.createDatabase('thai');
        expect(db).toBeInstanceOf(ThaiDatabase);
        expect(db.name).toBe('thai');
    });

    it('should create an EngDatabase instance for "eng" language', async () => {
        const db = await DatabaseFactory.createDatabase('eng');
        expect(db).toBeInstanceOf(EngDatabase);
        expect(db.name).toBe('eng');
    });

    it('should return the same instance for repeated calls with the same language', async () => {
        const db1 = await DatabaseFactory.createDatabase('thai');
        const db2 = await DatabaseFactory.createDatabase('thai');
        expect(db1).toBe(db2);
    });

    it('should create and associate Geo object correctly', async () => {
        DatabaseFactory.clearInstances();
        let db = await DatabaseFactory.createDatabase('thai');
        expect(db.getGeo()).toBeUndefined();

        DatabaseFactory.createGeo(new Geo());
        db = await DatabaseFactory.createDatabase('eng');
        expect(db.getGeo()).toBeInstanceOf(Geo);
    });
});

describe('ThaiDatabase', () => {
    let db: ThaiDatabase;

    beforeEach(() => {
        db = new ThaiDatabase();
    });

    it('should load words correctly', async () => {
        await db.load();
        expect(db.getWord().length).toBeGreaterThan(0);
    });

    it('should preprocess data correctly', async () => {
        await db.load();
        expect(db.getData().length).toBeGreaterThan(0);
    });
});

describe('EngDatabase', () => {
    let db: EngDatabase;

    beforeEach(() => {
        db = new EngDatabase();
    });

    it('should load words correctly', async () => {
        await db.load();
        expect(db.getWord().length).toBeGreaterThan(0);
    });

    it('should preprocess data correctly', async () => {
        await db.load();
        expect(db.getData().length).toBeGreaterThan(0);
    });
});
