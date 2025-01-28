import { getDefaultLanguage } from '../src/utils/helper';

describe('getDefaultLanguage Function for NodeJS', () => {
    it('should return "thai" when running in Node.js without environment variable set', () => {
        delete process.env.THAI_ADDRESS_UNIVERSAL;
        expect(getDefaultLanguage()).toBe('thai');
    });

    it('should return "eng" when running in Node.js with environment variable set to "eng"', () => {
        process.env.THAI_ADDRESS_UNIVERSAL = 'eng';
        expect(getDefaultLanguage()).toBe('eng');
    });

    it('should return "thai" when running in an environment that is neither Browser nor Node.js', () => {
        global.window = undefined as never;
        global.process = undefined as never;

        expect(getDefaultLanguage()).toBe('thai');
    });
});
