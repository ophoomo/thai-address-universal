import {
    ADDRESS_COMPONENT_FIELDS,
    ADDRESS_COMPONENT_PREFIX_PATTERN,
    BANGKOK_ALIAS_PATTERN,
    BANGKOK_CANONICAL_NAME,
    escapeRegExp,
    NOISE_TOKEN_PATTERN,
} from '../constants';
import type { IExpanded, IExpandedWithPoint } from '../types/thai-address';

/**
 * Normalises a free-text address before matching:
 *  1. every way of writing Bangkok collapses to its canonical name;
 *  2. the postal code, filler tokens and component prefixes ("ต.", "จังหวัด", …)
 *     are removed.
 *
 * @param address - The raw address string.
 * @param postalCode - The postal code already extracted from it.
 * @returns The trimmed remainder, ready for {@link getBestResult}.
 */
export const prepareAddress = (address: string, postalCode: string): string => {
    const withCanonicalBangkok = address.replace(
        BANGKOK_ALIAS_PATTERN,
        BANGKOK_CANONICAL_NAME,
    );

    const removable = new RegExp(
        [
            escapeRegExp(postalCode),
            NOISE_TOKEN_PATTERN.source,
            ADDRESS_COMPONENT_PREFIX_PATTERN.source,
        ].join('|'),
        'g',
    );

    return withCanonicalBangkok.replace(removable, '').trim();
};

/**
 * Number of address components ({@link ADDRESS_COMPONENT_FIELDS}) of `element`
 * that appear anywhere in `address`. A row needs all of them present to be a
 * candidate in {@link getBestResult}.
 */
export const calculateMatchPoints = (
    element: IExpandedWithPoint,
    address: string,
): number => {
    let points = 0;
    for (const field of ADDRESS_COMPONENT_FIELDS) {
        if (address.includes(element[field])) {
            points++;
        }
    }
    return points;
};

/**
 * Counts how many distinct whitespace-separated words of `address` are
 * explained by this row's components.
 *
 * A row that maps its sub-district and district onto two different words
 * accounts for more of the address than one that reuses a single word for
 * both — which is exactly what happens when a district has a same-named
 * sub-district.
 */
const distinctWordsCovered = (
    element: IExpandedWithPoint,
    words: string[],
): number => {
    const covered = new Set<string>();
    for (const field of ADDRESS_COMPONENT_FIELDS) {
        const value = element[field];
        for (const word of words) {
            if (
                word === value ||
                word.includes(value) ||
                value.includes(word)
            ) {
                covered.add(word);
            }
        }
    }
    return covered.size;
};

/**
 * Picks the row that best matches `address` from the rows sharing its postal
 * code.
 *
 * Any row whose district, sub-district and province all appear in `address` is
 * a candidate. Ties (a district with a same-named sub-district, or several
 * sub-districts of one district on the same postal code) are broken by, in
 * order: most distinct words of the address covered, then whether the
 * sub-district stands alone as a word.
 *
 * @returns The winning row with its `point` score, or `null` when no row has
 *          all three components present.
 */
export const getBestResult = (
    searchResult: IExpandedWithPoint[],
    address: string,
): IExpandedWithPoint | null => {
    const candidates = searchResult
        .map((element) => ({
            ...element,
            point: calculateMatchPoints(element, address),
        }))
        .filter((element) => element.point === ADDRESS_COMPONENT_FIELDS.length);

    if (candidates.length === 0) {
        return null;
    }
    if (candidates.length === 1) {
        return candidates[0];
    }

    const words = address.split(/\s+/).filter(Boolean);
    const subDistrictIsOwnWord = (element: IExpandedWithPoint): number =>
        words.includes(element.sub_district) ? 1 : 0;

    // `sort` is stable, so a full tie preserves the original row order.
    return [...candidates].sort(
        (a, b) =>
            distinctWordsCovered(b, words) - distinctWordsCovered(a, words) ||
            subDistrictIsOwnWord(b) - subDistrictIsOwnWord(a),
    )[0];
};

/**
 * Removes the matched components of `result` from `address`, leaving only the
 * house number / street / village part.
 *
 * @param address - The prepared address string.
 * @param result - The row {@link getBestResult} chose.
 * @returns The trimmed remainder.
 */
export const cleanupAddress = (address: string, result: IExpanded): string => {
    let remainder = address;
    for (const field of ADDRESS_COMPONENT_FIELDS) {
        const value = result[field];
        if (value) {
            remainder = remainder.replace(` ${value}`, '');
        }
    }
    return remainder.trim();
};
