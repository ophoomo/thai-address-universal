import { DatabaseFactory, ThaiDatabase } from '../src/core/database';
import { Geo } from '../src/core/geo';

describe('DatabaseFactory - Promise rejection handlers', () => {
    beforeEach(() => {
        DatabaseFactory.clearInstances();
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('createGeo - Promise rejection handler', () => {
        it('should handle setGeo rejection in createGeo', async () => {
            const db = await DatabaseFactory.createDatabase('thai');

            // Mock setGeo to reject
            jest.spyOn(db, 'setGeo').mockRejectedValueOnce(
                new Error('Geo set failed'),
            );

            const geo = new Geo();
            DatabaseFactory.createGeo(geo);

            // Wait for async operations to complete
            await new Promise((resolve) => setTimeout(resolve, 100));

            // Verify error was logged without throwing
            expect(console.error).toHaveBeenCalledWith(
                'Error setting geo data:',
                expect.any(Error),
            );
        });

        it('should continue processing other instances even if one fails', async () => {
            const db1 = await DatabaseFactory.createDatabase('thai');
            const db2 = await DatabaseFactory.createDatabase('eng');

            const setGeoDb1 = jest
                .spyOn(db1, 'setGeo')
                .mockRejectedValueOnce(new Error('Geo set failed for thai'));
            const setGeoDb2 = jest.spyOn(db2, 'setGeo').mockResolvedValueOnce();

            const geo = new Geo();
            DatabaseFactory.createGeo(geo);

            await new Promise((resolve) => setTimeout(resolve, 100));

            expect(setGeoDb1).toHaveBeenCalled();
            expect(setGeoDb2).toHaveBeenCalled();
        });
    });

    describe('clearGeo - Promise rejection handler', () => {
        it('should handle setGeo(undefined) rejection in clearGeo', async () => {
            const db = await DatabaseFactory.createDatabase('thai');

            // First set geo
            DatabaseFactory.createGeo(new Geo());

            // Then mock setGeo to reject on clear
            jest.spyOn(db, 'setGeo').mockRejectedValueOnce(
                new Error('Geo clear failed'),
            );

            DatabaseFactory.clearGeo();

            await new Promise((resolve) => setTimeout(resolve, 100));

            expect(console.error).toHaveBeenCalledWith(
                'Error clearing geo data:',
                expect.any(Error),
            );
        });

        it('should set geo to null even if instance operations fail', async () => {
            await DatabaseFactory.createDatabase('thai');
            jest.spyOn(console, 'error').mockImplementation(() => {});

            // Mock all instances to reject
            const instances = (
                DatabaseFactory as unknown as Record<string, unknown>
            ).instances as Map<string, unknown>;
            for (const instance of instances.values()) {
                const db = instance as unknown as { setGeo: jest.Mock };
                jest.spyOn(db, 'setGeo').mockRejectedValue(new Error('Failed'));
            }

            DatabaseFactory.clearGeo();

            // Verify geo is cleared
            const geo = (DatabaseFactory as unknown as Record<string, unknown>)
                .geo;
            expect(geo).toBeNull();
        });
    });

    describe('Database creation error handling', () => {
        it('should handle words already loaded - skip loadWord', async () => {
            const db1 = await DatabaseFactory.createDatabase('thai');

            // Modify the database to have words already loaded
            const dbInstance = db1 as unknown as Record<string, unknown>;
            const wordsProperty = dbInstance.words as unknown[];

            if (Array.isArray(wordsProperty)) {
                // If words exist, second load should be faster
                const startTime = Date.now();
                await db1.load?.();
                const endTime = Date.now();

                // Should complete quickly since words are already loaded
                expect(endTime - startTime).toBeLessThan(500);
            }
        });

        it('should surface error and log when DatabaseFactory.createDatabase fails', async () => {
            // Ensure no cached instances
            DatabaseFactory.clearInstances();
            jest.spyOn(console, 'error').mockImplementation(() => {});

            // Make ThaiDatabase.load reject so createDatabase throws
            jest.spyOn(
                ThaiDatabase.prototype as unknown as {
                    load: () => Promise<void>;
                },
                'load',
            ).mockRejectedValueOnce(new Error('load failed'));

            await expect(
                DatabaseFactory.createDatabase('thai'),
            ).rejects.toThrow('load failed');
            expect(console.error).toHaveBeenCalledWith(
                'Error creating thai database:',
                expect.any(Error),
            );
        });
    });
});
