import {
    ADDRESS_COMPONENT_FIELDS,
    ADDRESS_COMPONENT_PREFIX_PATTERN,
    BANGKOK_ALIAS_PATTERN,
    BANGKOK_ALIASES,
    BANGKOK_CANONICAL_NAME,
    escapeRegExp,
    GEOCODE_LENGTH,
    LANGUAGE,
    NOISE_TOKEN_PATTERN,
    POSTAL_CODE_LENGTH,
    POSTAL_CODE_PATTERN,
} from '../src/constants';

describe('constants', () => {
    it('models the hierarchical Thai geocode', () => {
        expect(GEOCODE_LENGTH.PROVINCE).toBeLessThan(GEOCODE_LENGTH.DISTRICT);
        expect(GEOCODE_LENGTH.DISTRICT).toBeLessThan(
            GEOCODE_LENGTH.SUB_DISTRICT,
        );
        expect(GEOCODE_LENGTH.SUB_DISTRICT).toBe(6);
    });

    it('pins the language identifiers', () => {
        expect(LANGUAGE).toEqual({ THAI: 'thai', ENGLISH: 'eng' });
    });

    it('lists the fully spelled Bangkok name first among its aliases', () => {
        expect(BANGKOK_ALIASES[0]).toBe(BANGKOK_CANONICAL_NAME);
    });
});

describe('escapeRegExp', () => {
    it('escapes every regex metacharacter', () => {
        const escaped = escapeRegExp('a.b*c(d)?');
        expect(new RegExp(`^${escaped}$`).test('a.b*c(d)?')).toBe(true);
        expect(new RegExp(`^${escaped}$`).test('axbxcxdx')).toBe(false);
    });
});

describe('derived patterns', () => {
    it('POSTAL_CODE_PATTERN captures a framed 5-digit group', () => {
        const match = '99 Moo 1 Bangkok 10330'.match(POSTAL_CODE_PATTERN);
        expect(match?.[1]).toBe('10330');
        expect(POSTAL_CODE_LENGTH).toBe(5);
        expect('no code here'.match(POSTAL_CODE_PATTERN)).toBeNull();
    });

    it('ADDRESS_COMPONENT_PREFIX_PATTERN matches known prefixes', () => {
        expect('ต.ลุมพินี'.replace(ADDRESS_COMPONENT_PREFIX_PATTERN, '')).toBe(
            'ลุมพินี',
        );
        expect('ตำบลลุมพินี'.replace(ADDRESS_COMPONENT_PREFIX_PATTERN, '')).toBe(
            'ลุมพินี',
        );
    });

    it('BANGKOK_ALIAS_PATTERN matches shorthands but leaves the canonical name whole', () => {
        expect(
            'กทม.'.replace(BANGKOK_ALIAS_PATTERN, BANGKOK_CANONICAL_NAME),
        ).toBe(BANGKOK_CANONICAL_NAME);
        expect(
            BANGKOK_CANONICAL_NAME.replace(
                BANGKOK_ALIAS_PATTERN,
                BANGKOK_CANONICAL_NAME,
            ),
        ).toBe(BANGKOK_CANONICAL_NAME);
    });

    it('NOISE_TOKEN_PATTERN removes filler tokens', () => {
        expect('Bangkok Thailand'.replace(NOISE_TOKEN_PATTERN, '').trim()).toBe(
            'Bangkok',
        );
    });

    it('orders ADDRESS_COMPONENT_FIELDS most-specific-last', () => {
        expect(ADDRESS_COMPONENT_FIELDS).toEqual([
            'district',
            'sub_district',
            'province',
        ]);
    });
});
