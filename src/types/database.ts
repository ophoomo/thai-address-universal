import type { Language } from '../constants';
import type { IGeo } from './geo';
import type { IExpanded } from './thai-address';

/** Language of a loaded dataset. Alias of {@link Language}, kept for the public API. */
export type ILanguage = Language;

/**
 * A language-specific address dataset: the flat list of expanded rows, the raw
 * word table used to decode them, and the optional geocode overlay.
 */
export interface IDatabase {
    /** Which language's data this instance holds. */
    name: ILanguage;

    /** Decodes the raw dataset into `data` (and `words`, on first call). */
    load(): Promise<void>;

    /** Every sub-district row, decoded. */
    getData(): IExpanded[];

    /** The decoded word table backing {@link IDatabase.getData}. */
    getWord(): string[];

    /** The geocode overlay, if geo mode is enabled. */
    getGeo(): IGeo | undefined;

    /** Attaches (or, with `undefined`, detaches) the geocode overlay and reloads. */
    setGeo(geo: IGeo | undefined): Promise<void>;
}
