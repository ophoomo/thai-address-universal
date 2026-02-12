import { DatabaseFactory, ThaiDatabase } from '../src/core/database';
import { Geo } from '../src/core/geo';

describe('DatabaseFactory - Error Handling and Edge Cases', () => {
    beforeEach(() => {
        DatabaseFactory.clearInstances();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('createDatabase - Error Handling', () => {
        it('should handle database loading with error gracefully', async () => {
            jest.spyOn(console, 'error').mockImplementation(() => {});

            // Create a fresh instance that will fail to load
            const db = new ThaiDatabase();
            // spy on the prototype (protected method) so TypeScript accepts it
            const loadWordSpy = jest
                .spyOn(
                    ThaiDatabase.prototype as unknown as {
                        loadWord: () => Promise<void>;
                    },
                    'loadWord',
                )
                .mockRejectedValue(new Error('Failed to load words'));

            // load() should not throw, but should reset data
            await db.load();

            // Verify that data was reset after error
            expect(db.getData()).toEqual([]);
            expect(db.getWord()).toEqual([]);
            expect(console.error).toHaveBeenCalledWith(
                'Error loading database:',
                expect.any(Error),
            );

            loadWordSpy.mockRestore();
        });
    });

    describe('createGeo - Error Handling', () => {
        it('should handle errors when setting geo on instances', async () => {
            const db = await DatabaseFactory.createDatabase('thai');
            const setGeoSpy = jest
                .spyOn(db, 'setGeo')
                .mockRejectedValue(new Error('Geo loading failed'));

            jest.spyOn(console, 'error').mockImplementation(() => {});

            const geo = new Geo();
            DatabaseFactory.createGeo(geo);

            await new Promise((resolve) => setTimeout(resolve, 100));

            expect(setGeoSpy).toHaveBeenCalled();
            expect(console.error).toHaveBeenCalledWith(
                'Error setting geo data:',
                expect.any(Error),
            );

            setGeoSpy.mockRestore();
        });
    });

    describe('clearGeo - Error Handling', () => {
        it('should handle errors when clearing geo on instances', async () => {
            const db = await DatabaseFactory.createDatabase('thai');
            const setGeoSpy = jest
                .spyOn(db, 'setGeo')
                .mockRejectedValue(new Error('Geo clearing failed'));

            jest.spyOn(console, 'error').mockImplementation(() => {});

            DatabaseFactory.clearGeo();

            await new Promise((resolve) => setTimeout(resolve, 100));

            expect(setGeoSpy).toHaveBeenCalledWith(undefined);
            expect(console.error).toHaveBeenCalledWith(
                'Error clearing geo data:',
                expect.any(Error),
            );

            setGeoSpy.mockRestore();
        });
    });

    describe('clearInstances', () => {
        it('should clear all database instances', async () => {
            const db1 = await DatabaseFactory.createDatabase('thai');
            const db2 = await DatabaseFactory.createDatabase('eng');

            DatabaseFactory.clearInstances();

            const db1New = await DatabaseFactory.createDatabase('thai');
            const db2New = await DatabaseFactory.createDatabase('eng');

            expect(db1).not.toBe(db1New);
            expect(db2).not.toBe(db2New);
        });
    });

    describe('Database.load() - Error Handling', () => {
        it('should handle errors during load and reset data', async () => {
            const db = new ThaiDatabase();

            // Mock loadWord to throw error on instance via prototype spy
            jest.spyOn(
                ThaiDatabase.prototype as unknown as {
                    loadWord: () => Promise<void>;
                },
                'loadWord',
            ).mockRejectedValue(new Error('Word loading failed'));

            jest.spyOn(console, 'error').mockImplementation(() => {});

            await db.load();

            expect(db.getData()).toEqual([]);
            expect(db.getWord()).toEqual([]);
            expect(console.error).toHaveBeenCalledWith(
                'Error loading database:',
                expect.any(Error),
            );
        });
    });
});
