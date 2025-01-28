/**
 * @jest-environment jsdom
 */
import { getDefaultLanguage } from '../src/utils/helper';

describe('getDefaultLanguage Function for Browser', () => {
    it('should return "thai" when running in browser without localStorage set', () => {
        delete process.env.THAI_ADDRESS_UNIVERSAL;
        window.localStorage.removeItem('THAI_ADDRESS_UNIVERSAL');
        expect(getDefaultLanguage()).toBe('thai');
    });

    it('should return "eng" when running in browser with localStorage set to "eng"', () => {
        delete process.env.THAI_ADDRESS_UNIVERSAL;
        window.localStorage.setItem('THAI_ADDRESS_UNIVERSAL', 'eng');
        expect(getDefaultLanguage()).toBe('eng');
    });
});
