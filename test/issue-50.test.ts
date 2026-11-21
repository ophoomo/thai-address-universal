/**
 * Regression tests for issue #50: `splitAddress` must parse back what
 * `formatAddress` writes, including
 *  1. names that contain a Thai prefix word (เขต / ตำบล / จ.);
 *  2. sub-districts whose name starts with their district's;
 *  3. English output with the administrative words (Tambon / Amphoe / …).
 *
 * The first block is the reporter's reproduction, verbatim; the rest covers
 * the variations around it, and the `splitAddress` → `formatAddress` /
 * `validateAddress` hand-off the README promises.
 */
import {
    formatAddress,
    setEngMode,
    splitAddress,
    validateAddress,
} from '../src/index';

const HOUSE = '99/9';

describe('issue #50 — reporter reproduction', () => {
    afterAll(async () => {
        await setEngMode(false);
    });

    it.each([
        ['ทุ่งพระยา', 'สนามชัยเขต', 'ฉะเชิงเทรา', '24160'],
        ['สามตำบล', 'จุฬาภรณ์', 'นครศรีธรรมราช', '80130'],
        ['บางแคเหนือ', 'บางแค', 'กรุงเทพมหานคร', '10160'],
        ['คลองท่อมเหนือ', 'คลองท่อม', 'กระบี่', '81120'],
    ])('Thai: %s / %s', async (subDistrict, district, province, postalCode) => {
        await setEngMode(false);
        const text = formatAddress({
            address: HOUSE,
            subDistrict,
            district,
            province,
            postalCode,
        });
        expect(await splitAddress(text)).toEqual({
            address: HOUSE,
            sub_district: subDistrict,
            district,
            province,
            postal_code: postalCode,
        });
    });

    it.each([[undefined], [true], [false]])(
        'English: Si Phum / Mueang Chiang Mai (prefix: %s)',
        async (prefix) => {
            await setEngMode(true);
            const text = formatAddress(
                {
                    address: HOUSE,
                    subDistrict: 'Si Phum',
                    district: 'Mueang Chiang Mai',
                    province: 'Chiang Mai',
                    postalCode: '50200',
                },
                { language: 'eng', prefix },
            );
            expect(await splitAddress(text)).toEqual({
                address: HOUSE,
                sub_district: 'Si Phum',
                district: 'Mueang Chiang Mai',
                province: 'Chiang Mai',
                postal_code: '50200',
            });
        },
    );
});

describe('issue #50 — English administrative words', () => {
    beforeAll(async () => {
        await setEngMode(true);
    });

    afterAll(async () => {
        await setEngMode(false);
    });

    it.each([
        [
            'Tambon / Amphoe / Changwat',
            '99/9 Tambon Si Phum Amphoe Mueang Chiang Mai Changwat Chiang Mai 50200',
            ['Si Phum', 'Mueang Chiang Mai', 'Chiang Mai'],
        ],
        [
            'Khwaeng / Khet in Bangkok',
            '99/9 Khwaeng Bang Khae Khet Bang Khae Bangkok 10160',
            ['Bang Khae', 'Bang Khae', 'Bangkok'],
        ],
        [
            'comma separated, ", Thailand" appended',
            '99/9, Tambon Si Phum, Amphoe Mueang Chiang Mai, Changwat Chiang Mai, 50200, Thailand',
            ['Si Phum', 'Mueang Chiang Mai', 'Chiang Mai'],
        ],
        [
            'lower-case words',
            '99/9 tambon Si Phum amphoe Mueang Chiang Mai changwat Chiang Mai 50200',
            ['Si Phum', 'Mueang Chiang Mai', 'Chiang Mai'],
        ],
        [
            'only some components prefixed',
            '99/9 Si Phum Amphoe Mueang Chiang Mai Chiang Mai 50200',
            ['Si Phum', 'Mueang Chiang Mai', 'Chiang Mai'],
        ],
    ])('%s', async (_name, text, [subDistrict, district, province]) => {
        const parsed = await splitAddress(text);
        expect(parsed).toMatchObject({
            address: HOUSE,
            sub_district: subDistrict,
            district,
            province,
        });
    });

    // "Khet" is also the last word of several names outside Bangkok. It is
    // only the district word in Bangkok, so it must survive elsewhere.
    it.each([
        [
            '99/9 Itan Khet Chaloem Phra Kiat Buri Ram 31110',
            'Itan Khet',
            'Chaloem Phra Kiat',
        ],
        [
            '99/9 Tambon Itan Khet Amphoe Chaloem Phra Kiat Changwat Buri Ram 31110',
            'Itan Khet',
            'Chaloem Phra Kiat',
        ],
        [
            '99/9 Tambon Tha Kradan Amphoe Snam Chai Khet Changwat Chachoengsao 24160',
            'Tha Kradan',
            'Snam Chai Khet',
        ],
    ])(
        'keeps "Khet" inside a name: %s',
        async (text, subDistrict, district) => {
            expect(await splitAddress(text)).toMatchObject({
                address: HOUSE,
                sub_district: subDistrict,
                district,
            });
        },
    );

    it('does not strip an administrative word that belongs to the house part', async () => {
        expect(
            await splitAddress(
                '99/9 Tambon Road Si Phum Mueang Chiang Mai Chiang Mai 50200',
            ),
        ).toMatchObject({
            address: '99/9 Tambon Road',
            sub_district: 'Si Phum',
        });
    });
});

describe('issue #50 — splitAddress result feeds formatAddress / validateAddress', () => {
    afterAll(async () => {
        await setEngMode(false);
    });

    it('formats a Thai splitAddress result back to the same text', async () => {
        await setEngMode(false);
        const text = '99/9 แขวงบางแคเหนือ เขตบางแค กรุงเทพมหานคร 10160';
        const parsed = await splitAddress(text);
        expect(parsed).not.toBeNull();
        expect(formatAddress(parsed ?? {})).toBe(text);
    });

    it('formats an English splitAddress result without Thai words', async () => {
        await setEngMode(true);
        const text = '99/9 Tha Kradan Snam Chai Khet Chachoengsao 24160';
        const parsed = await splitAddress(text);
        expect(parsed).not.toBeNull();
        expect(formatAddress(parsed ?? {})).toBe(text);
        expect(formatAddress(parsed ?? {}, { prefix: true })).toBe(
            '99/9 Tambon Tha Kradan Amphoe Snam Chai Khet Changwat Chachoengsao 24160',
        );
    });

    it('validates a Thai splitAddress result, checking every field', async () => {
        await setEngMode(false);
        const parsed = await splitAddress(
            '99/9 ตำบลทุ่งพระยา อำเภอสนามชัยเขต จังหวัดฉะเชิงเทรา 24160',
        );
        expect(await validateAddress(parsed ?? {})).toEqual({
            valid: true,
            errors: {},
            match: {
                sub_district: 'ทุ่งพระยา',
                district: 'สนามชัยเขต',
                province: 'ฉะเชิงเทรา',
                postal_code: '24160',
            },
        });

        // A wrong snake_case field is reported, not silently ignored.
        expect(
            await validateAddress({ ...parsed, postal_code: '10110' }),
        ).toMatchObject({
            valid: false,
            errors: { postalCode: expect.stringContaining('10110') },
        });
        expect(
            await validateAddress({ ...parsed, sub_district: 'ศรีภูมิ' }),
        ).toMatchObject({
            valid: false,
            errors: { subDistrict: expect.stringContaining('ศรีภูมิ') },
        });
    });

    it('validates an English splitAddress result without passing a language', async () => {
        await setEngMode(true);
        const parsed = await splitAddress(
            '99/9 Si Phum Mueang Chiang Mai Chiang Mai 50200',
        );
        expect(await validateAddress(parsed ?? {})).toMatchObject({
            valid: true,
            match: { sub_district: 'Si Phum', postal_code: '50200' },
        });
    });
});
