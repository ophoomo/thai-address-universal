/**
 * `splitAddress` must give back exactly the parts an address was written
 * from. These tests write every row of the dataset out in every common style
 * (see `support/address-styles.ts`) and parse it again.
 *
 * On top of the full sweep, the rows most likely to break a substring-based
 * parser are pulled out into named groups, so a regression points straight at
 * the kind of name that caused it:
 *  - names containing a prefix word (สนามชัยเขต, สามตำบล, จ.ป.ร., …);
 *  - a sub-district whose name starts with, ends with or contains its
 *    district's (บางแค / บางแคเหนือ, ห้วยราช / ห้วยราชา);
 *  - a sub-district with the same name as its district;
 *  - a name that is part of another component of the same row.
 */
import { ADDRESS_COMPONENT_PREFIXES } from '../src/constants';
import {
    formatAddress,
    getDatabase,
    setEngMode,
    splitAddress,
} from '../src/index';
import type { IExpanded } from '../src/types/thai-address';
import {
    type AddressStyle,
    BANGKOK,
    BANGKOK_ALIASES,
    ENGLISH_STYLES,
    HOUSE,
    RICH_HOUSE,
    THAI_STYLES,
} from './support/address-styles';

/** Rows `splitAddress` can resolve at all: it looks rows up by postal code. */
const parsableRows = (): IExpanded[] =>
    getDatabase().filter((row) => row.postal_code);

/**
 * Writes each row with `style`, parses it, and returns a readable line for
 * every row that does not come back unchanged. An empty array means success,
 * and on failure Jest prints exactly which addresses broke.
 */
const roundTripFailures = async (
    rows: IExpanded[],
    style: AddressStyle,
    { house = HOUSE, checkHouse = true } = {},
): Promise<string[]> => {
    const failures: string[] = [];
    for (const row of rows) {
        const input = style(row, house);
        const parsed = await splitAddress(input);
        const ok =
            parsed !== null &&
            parsed.sub_district === row.sub_district &&
            parsed.district === row.district &&
            parsed.province === row.province &&
            parsed.postal_code === row.postal_code &&
            (!checkHouse || parsed.address === house);
        if (!ok) {
            failures.push(`${input}  =>  ${JSON.stringify(parsed)}`);
        }
    }
    return failures;
};

const containsPrefixWord = (name: string): boolean =>
    ADDRESS_COMPONENT_PREFIXES.some((prefix) => name.includes(prefix));

/** Rows of the risky kinds described at the top of this file. */
const RISK_GROUPS: Record<string, (row: IExpanded) => boolean> = {
    'a name contains a prefix word': (row) =>
        containsPrefixWord(row.sub_district) ||
        containsPrefixWord(row.district),
    'sub-district starts with its district name': (row) =>
        row.sub_district !== row.district &&
        row.sub_district.startsWith(row.district),
    'sub-district ends with its district name': (row) =>
        row.sub_district !== row.district &&
        row.sub_district.endsWith(row.district),
    'district name is inside the sub-district name': (row) =>
        row.sub_district !== row.district &&
        row.sub_district.includes(row.district),
    'sub-district name is inside the district name': (row) =>
        row.sub_district !== row.district &&
        row.district.includes(row.sub_district),
    'sub-district has the same name as its district': (row) =>
        row.sub_district === row.district,
    'a name is inside the province name': (row) =>
        row.province.includes(row.sub_district) ||
        row.province.includes(row.district),
};

describe('splitAddress round trip — Thai dataset', () => {
    beforeAll(async () => {
        await setEngMode(false);
    });

    describe('every row, every writing style', () => {
        it.each(Object.entries(THAI_STYLES))('%s', async (_name, style) => {
            expect(await roundTripFailures(parsableRows(), style)).toEqual([]);
        });

        it('with a long house part (หมู่บ้าน / ซอย / ถนน)', async () => {
            expect(
                await roundTripFailures(
                    parsableRows(),
                    THAI_STYLES['full words (formatAddress)'],
                    { house: RICH_HOUSE },
                ),
            ).toEqual([]);
        });

        it('with no house part at all', async () => {
            const failures: string[] = [];
            for (const row of parsableRows()) {
                const input = formatAddress({
                    subDistrict: row.sub_district,
                    district: row.district,
                    province: row.province,
                    postalCode: row.postal_code,
                });
                // A leading space lets the postal-code pattern see the code
                // even when the address is nothing but components.
                const parsed = await splitAddress(` ${input}`);
                if (
                    parsed?.sub_district !== row.sub_district ||
                    parsed?.district !== row.district ||
                    parsed?.address !== ''
                ) {
                    failures.push(`${input}  =>  ${JSON.stringify(parsed)}`);
                }
            }
            expect(failures).toEqual([]);
        });
    });

    describe('Bangkok aliases', () => {
        it.each(BANGKOK_ALIASES)('province written as "%s"', async (alias) => {
            const rows = parsableRows().filter(
                (row) => row.province === BANGKOK,
            );
            expect(rows.length).toBeGreaterThan(100);
            const style: AddressStyle = (row, house) =>
                `${house} แขวง${row.sub_district} เขต${row.district} ${alias} ${row.postal_code}`;
            expect(await roundTripFailures(rows, style)).toEqual([]);
        });
    });

    describe.each(Object.entries(RISK_GROUPS))(
        'rows where %s',
        (_name, isRisky) => {
            const rows = (): IExpanded[] => parsableRows().filter(isRisky);

            it('exist in the dataset (so the group really tests something)', () => {
                expect(rows().length).toBeGreaterThan(0);
            });

            it.each(Object.entries(THAI_STYLES))(
                'round-trip: %s',
                async (_style, style) => {
                    expect(await roundTripFailures(rows(), style)).toEqual([]);
                },
            );
        },
    );
});

describe('splitAddress round trip — English dataset', () => {
    beforeAll(async () => {
        await setEngMode(true);
    });

    afterAll(async () => {
        await setEngMode(false);
    });

    it.each(Object.entries(ENGLISH_STYLES))('%s', async (_name, style) => {
        expect(await roundTripFailures(parsableRows(), style)).toEqual([]);
    });

    // English prefix words (Tambon / Amphoe / …) are opt-in and are not
    // stripped, so only the resolved components are checked, not the leftover
    // house part.
    it('with prefix: true, every component resolves', async () => {
        const style: AddressStyle = (row, house) =>
            formatAddress(
                {
                    address: house,
                    subDistrict: row.sub_district,
                    district: row.district,
                    province: row.province,
                    postalCode: row.postal_code,
                },
                { language: 'eng', prefix: true },
            );
        expect(
            await roundTripFailures(parsableRows(), style, {
                checkHouse: false,
            }),
        ).toEqual([]);
    });

    it('rows where a sub-district name is a word of the province name exist', () => {
        const rows = parsableRows().filter((row) =>
            row.province.split(' ').includes(row.sub_district),
        );
        expect(rows.length).toBeGreaterThan(0);
    });
});
