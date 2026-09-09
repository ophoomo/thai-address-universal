import type { IGeo } from '../types/geo';

/**
 * Lazily-loaded geocode overlay. The data is a flat number stream in the same
 * depth-first order as the address tree (see `preprocess`), kept in its own
 * chunk so it is only downloaded once geo mode is turned on.
 */
export class Geo implements IGeo {
    private data: (number | boolean)[] = [];

    /** The loaded geocode stream (empty until {@link Geo.load} resolves). */
    public getData(): (number | boolean)[] {
        return this.data;
    }

    /** Fetches and caches the geocode chunk. */
    public async load(): Promise<void> {
        const module = await import('../../migrate/output/geo.json');
        this.data = module.default as (number | boolean)[];
    }
}
