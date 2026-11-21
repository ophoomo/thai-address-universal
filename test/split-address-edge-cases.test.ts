/**
 * Hand-picked edge cases for `splitAddress` and its helpers. Each group pins
 * down one way a substring-based parser goes wrong:
 *  - stripping a prefix word from *inside* a name (สนามชัยเขต → สนามชัย);
 *  - matching a short name inside a longer one (บางแค inside บางแคเหนือ);
 *  - cutting a short name out of a longer one when cleaning up the remainder;
 *  - a name that is also one word of another component (Phanom / Nakhon Phanom).
 *
 * The dataset-wide sweep lives in `split-address-roundtrip.test.ts`.
 */
import { POSTAL_CODE_PATTERN } from '../src/constants';
import { getDatabase, setEngMode, splitAddress } from '../src/index';
import type { IExpanded, IExpandedWithPoint } from '../src/types/thai-address';
import {
    cleanupAddress,
    getBestResult,
    prepareAddress,
} from '../src/utils/split-address';
import { HOUSE, RICH_HOUSE, THAI_STYLES } from './support/address-styles';

const row = (
    sub_district: string,
    district: string,
    province: string,
    postal_code = '10000',
): IExpandedWithPoint => ({
    sub_district,
    district,
    province,
    postal_code,
    point: 0,
});

describe('prepareAddress', () => {
    const prepare = (text: string) => prepareAddress(`${text} 10000`, '10000');

    describe('keeps prefix words that are part of a name', () => {
        it.each([
            // name ends with a prefix word
            ['อำเภอสนามชัยเขต', 'สนามชัยเขต'],
            ['ตำบลหลักเขต', 'หลักเขต'],
            ['ตำบลอีสานเขต', 'อีสานเขต'],
            ['ตำบลคีรีเขต', 'คีรีเขต'],
            ['ตำบลคลองนครเนื่องเขต', 'คลองนครเนื่องเขต'],
            ['ตำบลสามตำบล', 'สามตำบล'],
            // dotted abbreviation as a name
            ['ตำบลจ.ป.ร.', 'จ.ป.ร.'],
            ['จ.ป.ร.', 'จ.ป.ร.'],
            // name without its prefix
            ['สนามชัยเขต', 'สนามชัยเขต'],
            ['สามตำบล', 'สามตำบล'],
        ])('"%s" → "%s"', (input, expected) => {
            expect(prepare(`99/9 ${input}`)).toBe(`99/9 ${expected}`);
        });
    });

    describe('removes every prefix where it introduces a component', () => {
        it.each([
            'ตำบล',
            'อำเภอ',
            'จังหวัด',
            'แขวง',
            'เขต',
            'ต.',
            'อ.',
            'จ.',
            'แขวง.',
            'เขต.',
        ])('"%s" glued to the name', (prefix) => {
            expect(prepare(`99/9 ${prefix}ศรีภูมิ`)).toBe('99/9 ศรีภูมิ');
        });

        it.each(['ต.', 'อ.', 'จ.', 'แขวง', 'เขต'])(
            '"%s" followed by a space',
            (prefix) => {
                expect(prepare(`99/9 ${prefix} ศรีภูมิ`)).toBe('99/9  ศรีภูมิ');
            },
        );

        it('at the very start of the string', () => {
            expect(prepare('ตำบลศรีภูมิ')).toBe('ศรีภูมิ');
        });

        it('right after a comma', () => {
            expect(prepare('99/9,ต.ศรีภูมิ,อ.เมืองเชียงใหม่')).toBe(
                '99/9,ศรีภูมิ,เมืองเชียงใหม่',
            );
        });

        it('right after a house number', () => {
            expect(prepare('99/9ต.ศรีภูมิ')).toBe('99/9ศรีภูมิ');
        });

        it('in a full address with every component', () => {
            expect(
                prepare('99/9 ตำบลทุ่งพระยา อำเภอสนามชัยเขต จังหวัดฉะเชิงเทรา'),
            ).toBe('99/9 ทุ่งพระยา สนามชัยเขต ฉะเชิงเทรา');
        });
    });
});

describe('getBestResult', () => {
    it('prefers the sub-district that extends its district name', () => {
        const rows = [
            row('บางแค', 'บางแค', 'กรุงเทพมหานคร'),
            row('บางแคเหนือ', 'บางแค', 'กรุงเทพมหานคร'),
        ];
        expect(
            getBestResult(rows, '99/9 บางแคเหนือ บางแค กรุงเทพมหานคร')
                ?.sub_district,
        ).toBe('บางแคเหนือ');
    });

    it('still picks the same-named sub-district when that is what was written', () => {
        const rows = [
            row('บางแคเหนือ', 'บางแค', 'กรุงเทพมหานคร'),
            row('บางแค', 'บางแค', 'กรุงเทพมหานคร'),
        ];
        expect(
            getBestResult(rows, '99/9 บางแค บางแค กรุงเทพมหานคร')?.sub_district,
        ).toBe('บางแค');
    });

    it('prefers a sub-district that only differs by a trailing letter', () => {
        const rows = [
            row('ห้วยราช', 'ห้วยราช', 'บุรีรัมย์'),
            row('ห้วยราชา', 'ห้วยราช', 'บุรีรัมย์'),
        ];
        expect(
            getBestResult(rows, '99/9 ห้วยราชา ห้วยราช บุรีรัมย์')?.sub_district,
        ).toBe('ห้วยราชา');
    });

    it('does not count a name found only inside another component', () => {
        // "Phanom" is a sub-district of Tha Uthen, and also the last word of
        // the province "Nakhon Phanom".
        const rows = [
            row('Phanom', 'Tha Uthen', 'Nakhon Phanom'),
            row('Tha Uthen', 'Tha Uthen', 'Nakhon Phanom'),
        ];
        expect(
            getBestResult(rows, '99/9 Tha Uthen Tha Uthen Nakhon Phanom')
                ?.sub_district,
        ).toBe('Tha Uthen');
    });

    it('matches multi-word names word by word', () => {
        const rows = [
            row('Si Phum', 'Mueang Chiang Mai', 'Chiang Mai'),
            row('Phra Sing', 'Mueang Chiang Mai', 'Chiang Mai'),
        ];
        expect(
            getBestResult(rows, '99/9 Si Phum Mueang Chiang Mai Chiang Mai')
                ?.sub_district,
        ).toBe('Si Phum');
    });

    it('accepts a name with a component prefix still attached', () => {
        const rows = [row('จ.ป.ร.', 'กระบุรี', 'ระนอง')];
        expect(
            getBestResult(rows, '99/9 ต.จ.ป.ร. กระบุรี ระนอง')?.sub_district,
        ).toBe('จ.ป.ร.');
    });

    it('returns null when a component is missing', () => {
        const rows = [row('บางแคเหนือ', 'บางแค', 'กรุงเทพมหานคร')];
        expect(getBestResult(rows, '99/9 บางแค กรุงเทพมหานคร')).toBeNull();
    });
});

describe('cleanupAddress', () => {
    const clean = (address: string, parts: IExpanded) =>
        cleanupAddress(address, parts);

    it('removes the longer sub-district before its district', () => {
        expect(
            clean(
                '99/9 คลองท่อมเหนือ คลองท่อม กระบี่',
                row('คลองท่อมเหนือ', 'คลองท่อม', 'กระบี่'),
            ),
        ).toBe('99/9');
    });

    it('removes the longer district before its sub-district', () => {
        expect(
            clean(
                '99/9 ห้วยราช ห้วยราชา บุรีรัมย์',
                row('ห้วยราช', 'ห้วยราชา', 'บุรีรัมย์'),
            ),
        ).toBe('99/9');
    });

    it('removes both copies of a same-named sub-district and district', () => {
        expect(
            clean(
                '55 ม.3 บางกรวย บางกรวย นนทบุรี',
                row('บางกรวย', 'บางกรวย', 'นนทบุรี'),
            ),
        ).toBe('55 ม.3');
    });

    it('removes multi-word English names', () => {
        expect(
            clean(
                '99/9 Moo 5 Si Phum Mueang Chiang Mai Chiang Mai',
                row('Si Phum', 'Mueang Chiang Mai', 'Chiang Mai'),
            ),
        ).toBe('99/9 Moo 5');
    });

    it('never cuts a name out of a word in the house part', () => {
        expect(
            clean(
                '9 ถนนบางแค บางแค บางแค กรุงเทพมหานคร',
                row('บางแค', 'บางแค', 'กรุงเทพมหานคร'),
            ),
        ).toBe('9 ถนนบางแค');
    });

    it('keeps a house word that has the same name as a component', () => {
        expect(
            clean(
                '99 หมู่บ้าน บางแค ซอย 3 บางแค บางแค กรุงเทพมหานคร',
                row('บางแค', 'บางแค', 'กรุงเทพมหานคร'),
            ),
        ).toBe('99 หมู่บ้าน บางแค ซอย 3');
    });

    it('removes a name with a component prefix still attached', () => {
        expect(
            clean('99/9 ต.จ.ป.ร. กระบุรี ระนอง', row('จ.ป.ร.', 'กระบุรี', 'ระนอง')),
        ).toBe('99/9');
    });

    it('drops separators left dangling by a comma-separated address', () => {
        expect(
            clean(
                '99/9 หมู่ 5, ศรีภูมิ, เมืองเชียงใหม่, เชียงใหม่,',
                row('ศรีภูมิ', 'เมืองเชียงใหม่', 'เชียงใหม่'),
            ),
        ).toBe('99/9 หมู่ 5');
    });

    it('returns an empty string when only components were given', () => {
        expect(
            clean(
                'ศรีภูมิ เมืองเชียงใหม่ เชียงใหม่',
                row('ศรีภูมิ', 'เมืองเชียงใหม่', 'เชียงใหม่'),
            ),
        ).toBe('');
    });
});

describe('POSTAL_CODE_PATTERN', () => {
    it.each([
        ['… เชียงใหม่ 50200', '50200'],
        ['… เชียงใหม่ 50200 Thailand', '50200'],
        ['…,เชียงใหม่,50200', '50200'],
        ['… เชียงใหม่, 50200, Thailand', '50200'],
        ['… เชียงใหม่\t50200', '50200'],
    ])('finds the code in "%s"', (input, code) => {
        expect(input.match(POSTAL_CODE_PATTERN)?.[1]).toBe(code);
    });

    it.each(['… เชียงใหม่ 502001', '… เชียงใหม่ 5020', '… เชียงใหม่50200'])(
        'does not take a non-5-digit or glued number in "%s"',
        (input) => {
            expect(input.match(POSTAL_CODE_PATTERN)).toBeNull();
        },
    );
});

describe('splitAddress — known tricky names, every style', () => {
    beforeAll(async () => {
        await setEngMode(false);
    });

    /** [sub-district, district] pairs; the rest of the row comes from the data. */
    const TRICKY: [string, string][] = [
        // name contains a prefix word
        ['ทุ่งพระยา', 'สนามชัยเขต'],
        ['คู้ยายหมี', 'สนามชัยเขต'],
        ['สามตำบล', 'จุฬาภรณ์'],
        ['หลักเขต', 'เมืองบุรีรัมย์'],
        ['อีสานเขต', 'เฉลิมพระเกียรติ'],
        ['คีรีเขต', 'ธารโต'],
        ['คลองนครเนื่องเขต', 'เมืองฉะเชิงเทรา'],
        ['จ.ป.ร.', 'กระบุรี'],
        // sub-district starts with its district name
        ['บางแคเหนือ', 'บางแค'],
        ['บางนาเหนือ', 'บางนา'],
        ['บางนาใต้', 'บางนา'],
        ['คลองท่อมเหนือ', 'คลองท่อม'],
        ['อ่าวลึกน้อย', 'อ่าวลึก'],
        ['เกาะลันตาใหญ่', 'เกาะลันตา'],
        ['ปากพนังฝั่งตะวันออก', 'ปากพนัง'],
        ['รือเสาะออก', 'รือเสาะ'],
        ['เถินบุรี', 'เถิน'],
        ['ห้วยราชา', 'ห้วยราช'],
        ['เกาะช้างใต้', 'เกาะช้าง'],
        ['ธาตุพนมเหนือ', 'ธาตุพนม'],
        // the same-named sub-district next to its longer siblings
        ['บางแค', 'บางแค'],
        ['คลองท่อมใต้', 'คลองท่อม'],
        ['บางกรวย', 'บางกรวย'],
    ];

    const findRow = (sub: string, district: string): IExpanded => {
        const found = getDatabase().find(
            (r) => r.sub_district === sub && r.district === district,
        );
        if (!found) {
            throw new Error(`${sub} / ${district} is not in the dataset`);
        }
        return found;
    };

    describe.each(TRICKY)('%s / %s', (sub, district) => {
        it.each(Object.entries(THAI_STYLES))('%s', async (_name, style) => {
            const r = findRow(sub, district);
            expect(await splitAddress(style(r, HOUSE))).toEqual({
                address: HOUSE,
                sub_district: r.sub_district,
                district: r.district,
                province: r.province,
                postal_code: r.postal_code,
            });
        });

        it('with a long house part', async () => {
            const r = findRow(sub, district);
            const parsed = await splitAddress(
                THAI_STYLES['full words (formatAddress)'](r, RICH_HOUSE),
            );
            expect(parsed?.address).toBe(RICH_HOUSE);
            expect(parsed?.sub_district).toBe(sub);
        });
    });
});

describe('splitAddress — inputs that must not resolve', () => {
    beforeAll(async () => {
        await setEngMode(false);
    });

    it.each([
        ['no postal code', '99/9 ตำบลศรีภูมิ อำเภอเมืองเชียงใหม่ จังหวัดเชียงใหม่'],
        [
            'unknown postal code',
            '99/9 ตำบลศรีภูมิ อำเภอเมืองเชียงใหม่ จังหวัดเชียงใหม่ 99999',
        ],
        [
            'postal code of another province',
            '99/9 ตำบลศรีภูมิ อำเภอเมืองเชียงใหม่ จังหวัดเชียงใหม่ 10160',
        ],
        ['sub-district missing', '99/9 อำเภอเมืองเชียงใหม่ จังหวัดเชียงใหม่ 50200'],
        ['district missing', '99/9 ตำบลศรีภูมิ จังหวัดเชียงใหม่ 50200'],
        // (not เมืองเชียงใหม่: its name already contains the province's)
        ['province missing', '99/9 ตำบลทุ่งพระยา อำเภอสนามชัยเขต 24160'],
        [
            'postal code glued to the province',
            '99/9 ตำบลศรีภูมิ อำเภอเมืองเชียงใหม่ จังหวัดเชียงใหม่50200',
        ],
        ['empty string', ''],
    ])('%s', async (_name, input) => {
        expect(await splitAddress(input)).toBeNull();
    });
});
