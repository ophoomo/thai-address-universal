import { IExpanded, IExpandedWithPoint } from '../types/thai-address.d';

/**
 * An array of field names used to reference specific address components in the IExpanded object.
 * This array contains the keys of the IExpanded interface that represent the district, sub-district, and province.
 */
const fields: (keyof IExpanded)[] = ['district', 'sub_district', 'province'];

// Pre-compiled regex patterns for better performance
const LOCATION_ABBREVIATIONS =
    /ต\.|อ\.|จ\.|ตำบล|อำเภอ|จังหวัด|แขวง|เขต|แขวง\.|เขต\./g;
const BANGKOK_PATTERNS = /(กทม\.?|กรุงเทพฯ?|กรุงเทพ)/gi;
const BANGKOK_REPLACEMENT = 'กรุงเทพมหานคร';

/**
 * Prepares the address string by removing certain keywords and replacing specific abbreviations.
 * This function removes or replaces common terms, abbreviations, and the postal code from the address string to standardize it for further processing.
 *
 * @param address - The full address string to be prepared.
 * @param postal_code - The postal code code to be removed from the address.
 *
 * @returns The cleaned and standardized address string with the specified terms and postal code removed.
 */
export const prepareAddress = (
    address: string,
    postal_code: string,
): string => {
    // First replace Bangkok abbreviations before removing location abbreviations
    const result = address.replace(BANGKOK_PATTERNS, BANGKOK_REPLACEMENT);

    // Then remove other components
    const replacements = new RegExp(
        `${postal_code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}|Thailand|${LOCATION_ABBREVIATIONS.source}|\\b(กทม|กรุงเทพ)\\b`,
        'g',
    );

    return result.replace(replacements, '').trim();
};

/**
 * Calculates the match points for a given address based on the number of address components that match.
 * This function compares the provided address against the elements' fields and counts how many fields in the element match the address.
 *
 * @param element - An address object (IExpandedWithPoint) containing various address components.
 * @param address - The address string to compare with the fields of the element.
 *
 * @returns The number of matching fields (match points) between the address and the element.
 */
export const calculateMatchPoints = (
    element: IExpandedWithPoint,
    address: string,
): number => {
    let matchCount = 0;
    for (const field of fields) {
        if (address.includes(element[field] as string)) {
            matchCount++;
        }
    }
    return matchCount;
};

/**
 * Determines the best matching address from the search results based on a calculated match score.
 * This function calculates match points for each address in the search results, sorts them by score,
 * and returns the highest-scored result if it meets a minimum threshold.
 *
 * @param searchResult - An array of address objects with match points to be evaluated.
 * @param address - The address string to compare against the search results.
 *
 * @returns The best matching address (IExpandedWithPoint) if the highest score is 3, or null if no match meets the threshold.
 */
export const getBestResult = (
    searchResult: IExpandedWithPoint[],
    address: string,
): IExpandedWithPoint | null => {
    let bestResult: IExpandedWithPoint | null = null;
    let maxPoint = 0;

    for (const element of searchResult) {
        const point = calculateMatchPoints(element, address);
        if (point > maxPoint) {
            maxPoint = point;
            bestResult = { ...element, point };
        }
    }

    return maxPoint === 3 ? bestResult : null;
};

/**
 * Cleans up the address by removing specific address components from the address string.
 * This function iterates over a list of fields and removes any occurrences of the corresponding values from the address string.
 * The result is a cleaned-up address with those components removed.
 *
 * @param address - The full address string to be cleaned up.
 * @param result - An object containing address components to be removed from the full address.
 *
 * @returns A cleaned-up address string with the specified components removed.
 */
export const cleanupAddress = (address: string, result: IExpanded): string => {
    let cleaned = address;
    for (const field of fields) {
        const fieldValue = result[field];
        if (fieldValue) {
            // Use simple string replacement instead of RegExp for better performance
            cleaned = cleaned.replace(` ${fieldValue}`, '');
        }
    }
    return cleaned.trim();
};
