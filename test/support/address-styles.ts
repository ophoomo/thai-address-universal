/**
 * Ways people write a Thai address, shared by the `splitAddress` round-trip
 * and edge-case tests. Each style turns a dataset row plus a house part into
 * one free-text address that `splitAddress` should parse back unchanged.
 */
import {
    BANGKOK_ALIASES as BANGKOK_ALIAS_LIST,
    BANGKOK_CANONICAL_NAME,
    BANGKOK_ENGLISH_NAME,
} from '../../src/constants';
import { formatAddress } from '../../src/index';
import type { IExpanded } from '../../src/types/thai-address';

/** Writes `row` with `house` in front, in one particular style. */
export type AddressStyle = (row: IExpanded, house: string) => string;

/** The canonical Thai name of Bangkok. */
export const BANGKOK = BANGKOK_CANONICAL_NAME;

/** Every way of writing Bangkok that `splitAddress` accepts. */
export const BANGKOK_ALIASES: string[] = [...BANGKOK_ALIAS_LIST];

/** A short house part. */
export const HOUSE = '99/9';

/** A long house part with a village, soi and road. */
export const RICH_HOUSE = '88/12 หมู่ 3 หมู่บ้านสุขใจ ซอย 5 ถนนสายหลัก';

const parts = (row: IExpanded, house: string) => ({
    address: house,
    subDistrict: row.sub_district,
    district: row.district,
    province: row.province,
    postalCode: row.postal_code,
});

const isBangkok = (row: IExpanded): boolean => row.province === BANGKOK;

/** Abbreviated prefixes; Bangkok keeps แขวง / เขต and has no province word. */
const abbreviated =
    (gap: string): AddressStyle =>
    (row, house) =>
        isBangkok(row)
            ? `${house} แขวง${gap}${row.sub_district} เขต${gap}${row.district} ${row.province} ${row.postal_code}`
            : `${house} ต.${gap}${row.sub_district} อ.${gap}${row.district} จ.${gap}${row.province} ${row.postal_code}`;

export const THAI_STYLES: Record<string, AddressStyle> = {
    'full words (formatAddress)': (row, house) =>
        formatAddress(parts(row, house)),
    'abbreviated (ต. อ. จ.)': abbreviated(''),
    'abbreviated with a space after the dot': abbreviated(' '),
    'no prefixes': (row, house) =>
        formatAddress(parts(row, house), { prefix: false }),
    'comma separated': (row, house) =>
        formatAddress(parts(row, house), { separator: ', ' }),
    'comma separated, no spaces': (row, house) =>
        formatAddress(parts(row, house), { separator: ',' }),
    'trailing "Thailand"': (row, house) =>
        `${formatAddress(parts(row, house))} Thailand`,
};

export const ENGLISH_STYLES: Record<string, AddressStyle> = {
    'bare names (formatAddress)': (row, house) =>
        formatAddress(parts(row, house), { language: 'eng' }),
    'comma separated': (row, house) =>
        formatAddress(parts(row, house), { language: 'eng', separator: ', ' }),
    'comma separated with ", Thailand"': (row, house) =>
        `${formatAddress(parts(row, house), { language: 'eng', separator: ', ' })}, Thailand`,
    'with prefixes (Tambon / Amphoe / Changwat, Khwaeng / Khet)': (
        row,
        house,
    ) => formatAddress(parts(row, house), { language: 'eng', prefix: true }),
    'with prefixes, comma separated': (row, house) =>
        formatAddress(parts(row, house), {
            language: 'eng',
            prefix: true,
            separator: ', ',
        }),
    'with lower-case prefixes': (row, house) =>
        row.province === BANGKOK_ENGLISH_NAME
            ? `${house} khwaeng ${row.sub_district} khet ${row.district} ${row.province} ${row.postal_code}`
            : `${house} tambon ${row.sub_district} amphoe ${row.district} changwat ${row.province} ${row.postal_code}`,
    'language inferred from the names': (row, house) =>
        formatAddress(parts(row, house)),
};
