import { inferLanguage } from '../src/utils/language';

describe('inferLanguage', () => {
    it.each([
        [['ศรีภูมิ', 'เมืองเชียงใหม่'], 'thai'],
        [['Si Phum', 'Mueang Chiang Mai'], 'eng'],
        [['Si Phum', 'เมืองเชียงใหม่'], 'thai'],
        [[undefined, 'Bangkok', undefined], 'eng'],
        [[], 'thai'],
        [[undefined, ''], 'thai'],
        [['50200', 10110], 'thai'],
    ] as const)('%j → %s', (values, expected) => {
        expect(inferLanguage(values)).toBe(expected);
    });
});
