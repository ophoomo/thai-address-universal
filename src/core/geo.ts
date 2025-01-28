import { IGeo } from '../types/geo';

export class Geo implements IGeo {
    private data: (number | boolean)[] = [];

    /**
     * Retrieves the loaded geo data.
     * @returns An array of geo data (numbers or booleans).
     */
    public getData(): (number | boolean)[] {
        return this.data;
    }

    /**
     * Loads geo data from a JSON file asynchronously.
     * The data is stored in the `data` property of the class.
     */
    public async load() {
        const rawData = await import('../../migrate/output/geo.json');
        this.data = rawData.default as (number | boolean)[];
    }
}
