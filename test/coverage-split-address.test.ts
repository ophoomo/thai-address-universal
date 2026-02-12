import { cleanupAddress } from '../src/utils/split-address';
import { IExpanded } from '../src/types/thai-address';

describe('Split Address - Branch coverage for cleanupAddress', () => {
    describe('cleanupAddress - fieldValue falsy check', () => {
        it('should skip cleanup for empty string field values', () => {
            const result: IExpanded = {
                province: '',
                district: 'Pathum Wan',
                sub_district: 'Lumphini',
                postal_code: '10330',
            };

            const address = ' Pathum Wan Lumphini';
            const cleaned = cleanupAddress(address, result);

            // Should still clean districts and sub-districts
            expect(cleaned).not.toContain('Pathum Wan');
            expect(cleaned).not.toContain('Lumphini');
        });

        it('should handle falsy fieldValue without crashing', () => {
            const result: Partial<IExpanded> = {
                province: 'Bangkok',
                district: undefined,
                sub_district: null as unknown as string,
                postal_code: '10330',
            };

            const address = ' Bangkok 123 Street';
            const cleaned = cleanupAddress(address, result as IExpanded);

            // Should clean Bangkok but skip undefined/null values
            expect(cleaned).not.toContain('Bangkok');
            expect(cleaned).toContain('123 Street');
        });

        it('should handle address with no matching field values', () => {
            const result: IExpanded = {
                province: 'Chiang Mai',
                district: 'Mueang',
                sub_district: 'Old Town',
                postal_code: '50200',
            };

            // Address doesn't contain any of the fields
            const address = ' 123 Street Bangkok';
            const cleaned = cleanupAddress(address, result);

            // Should return mostly unchanged since no fields match
            expect(cleaned).toContain('123 Street');
        });

        it('should iterate all fields even when some are falsy', () => {
            const result: IExpanded = {
                province: '',
                district: '',
                sub_district: 'Target',
                postal_code: '',
            };

            const address = ' Target 123';
            const cleaned = cleanupAddress(address, result);

            expect(cleaned).not.toContain('Target');
            expect(cleaned).toContain('123');
        });
    });
});
