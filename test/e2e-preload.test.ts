import {
    getEngMode,
    getGeoMode,
    getProvinceAll,
    preload,
} from '../src/core/thai-address';

describe('preload', () => {
    it('leaves the singletons initialised without changing language or geo mode', async () => {
        await preload({ language: 'both', geo: true });
        // safe to call the synchronous getters now that preload initialised
        expect(getGeoMode()).toBe(false);
        expect(getEngMode()).toBe(false);
        expect((await getProvinceAll()).length).toBe(77);
    });

    it('is safe to call repeatedly and concurrently', async () => {
        await expect(
            Promise.all([preload(), preload({ language: 'eng' }), preload()]),
        ).resolves.toEqual([undefined, undefined, undefined]);
    });
});
