import {
    ADDRESS_COMPONENT_FIELDS,
    ADDRESS_COMPONENT_LEADING_PREFIX_PATTERN,
    ADDRESS_COMPONENT_PREFIX_PATTERN,
    ADDRESS_WORD_SEPARATOR_PATTERN,
    type AddressComponentField,
    BANGKOK_ALIAS_PATTERN,
    BANGKOK_CANONICAL_NAME,
    BANGKOK_ENGLISH_NAME,
    COMPONENT_PREFIX,
    escapeRegExp,
    NOISE_TOKEN_PATTERN,
} from '../constants';
import type { IExpanded, IExpandedWithPoint } from '../types/thai-address';

/**
 * Normalises a free-text address before matching:
 *  1. every way of writing Bangkok collapses to its canonical name;
 *  2. the postal code and filler tokens are removed;
 *  3. component prefixes ("ต.", "จังหวัด", …) are removed where they introduce
 *     a component — never from inside a name such as "สนามชัยเขต" or
 *     "สามตำบล".
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
        [escapeRegExp(postalCode), NOISE_TOKEN_PATTERN.source].join('|'),
        'g',
    );

    return withCanonicalBangkok
        .replace(removable, '')
        .replace(ADDRESS_COMPONENT_LEADING_PREFIX_PATTERN, '$1')
        .trim();
};

/** Splits text into words on whitespace and commas. */
const toWords = (text: string): string[] =>
    text.split(ADDRESS_WORD_SEPARATOR_PATTERN).filter(Boolean);

/**
 * An optional component prefix still attached to the front of a word.
 * {@link prepareAddress} leaves "ต." in "ต.จ.ป.ร." (it cannot tell the prefix
 * from the abbreviated name), so word matching tolerates one left in place.
 */
const ATTACHED_PREFIX = `(?:${ADDRESS_COMPONENT_PREFIX_PATTERN.source})?`;

/** Whether `word` is `name`, possibly with a component prefix glued on. */
const isWordFor = (word: string, name: string): boolean =>
    word === name ||
    (word.endsWith(name) &&
        new RegExp(`^${ATTACHED_PREFIX}$`).test(
            word.slice(0, word.length - name.length),
        ));

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

/** How well a row's components line up with the words of the address. */
interface WordPlacement {
    /** Components found as whole words, each on words no other one uses. */
    placed: number;
    /** Distinct words of the address those components account for. */
    covered: number;
}

/**
 * Places each component of `element` on its own whole-word occurrence in
 * `words` — longest name first, no two components sharing a word.
 *
 * Whole words matter because {@link calculateMatchPoints} only checks for
 * substrings: the district "บางแค" also "appears" inside the sub-district
 * "บางแคเหนือ". Not sharing words matters because a short name can be part of
 * a longer one: the sub-district "Phanom" is the last word of the province
 * "Nakhon Phanom", and must not be counted as present on the strength of it.
 */
const placeComponents = (
    element: IExpandedWithPoint,
    words: string[],
): WordPlacement => {
    const used = new Set<number>();
    let placed = 0;

    const values = ADDRESS_COMPONENT_FIELDS.map((field) => element[field]).sort(
        (a, b) => b.length - a.length,
    );
    for (const value of values) {
        const target = toWords(value);
        if (target.length === 0) {
            continue;
        }
        for (let start = 0; start + target.length <= words.length; start++) {
            const fits = target.every(
                (word, offset) =>
                    !used.has(start + offset) &&
                    (offset === 0
                        ? isWordFor(words[start], word)
                        : words[start + offset] === word),
            );
            if (fits) {
                for (let offset = 0; offset < target.length; offset++) {
                    used.add(start + offset);
                }
                placed++;
                break;
            }
        }
    }
    return { placed, covered: used.size };
};

/**
 * Picks the row that best matches `address` from the rows sharing its postal
 * code.
 *
 * Any row whose district, sub-district and province all appear in `address` is
 * a candidate. Ties (a district with a same-named sub-district, a sub-district
 * whose name starts with its district's, or several sub-districts of one
 * district on the same postal code) are broken by, in order: most components
 * placed on whole words of their own, most distinct words covered, then
 * whether the sub-district stands alone as a word.
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

    const words = toWords(address);
    const ranked = candidates.map((element) => ({
        element,
        ...placeComponents(element, words),
        subDistrictIsOwnWord: words.includes(element.sub_district) ? 1 : 0,
    }));

    // `sort` is stable, so a full tie preserves the original row order.
    ranked.sort(
        (a, b) =>
            b.placed - a.placed ||
            b.covered - a.covered ||
            b.subDistrictIsOwnWord - a.subDistrictIsOwnWord,
    );
    return ranked[0].element;
};

/** Where each address component's word lives in {@link COMPONENT_PREFIX}. */
const COMPONENT_PREFIX_KEY = {
    sub_district: 'subDistrict',
    district: 'district',
    province: 'province',
} as const satisfies Record<
    AddressComponentField,
    keyof (typeof COMPONENT_PREFIX)['eng']
>;

/** "Tambon" → "[Tt]ambon", so a lower-case "tambon" is recognised too. */
const firstLetterCaseless = (word: string): string =>
    `[${word[0].toUpperCase()}${word[0].toLowerCase()}]${escapeRegExp(word.slice(1))}`;

/**
 * An optional English administrative word ("Tambon ", "Amphoe ", …) in front
 * of `field`, as `formatAddress` writes it with `prefix: true`.
 *
 * Only the word that belongs to that component is accepted — "Khet" in front
 * of a Bangkok district, "Amphoe" in front of any other — rather than any
 * prefix word anywhere. Several English names end in a prefix word ("Itan
 * Khet", "Khini Khet", "Snam Chai Khet"), and those must not lose it to the
 * component that follows them.
 */
const englishPrefixFor = (
    field: AddressComponentField,
    result: IExpanded,
): string => {
    const words =
        result.province === BANGKOK_ENGLISH_NAME
            ? COMPONENT_PREFIX.engBangkok
            : COMPONENT_PREFIX.eng;
    const word: string = words[COMPONENT_PREFIX_KEY[field]];
    return word ? `${firstLetterCaseless(word)}\\s+` : '';
};

/**
 * Removes the matched components of `result` from `address`, leaving only the
 * house number / street / village part.
 *
 * Longer names go first and are removed as whole words, so a district such as
 * "คลองท่อม" is never cut out of the sub-district "คลองท่อมเหนือ". A name
 * glued to other text (no separator) falls back to plain substring removal.
 * The administrative word in front of a name — Thai ("ต.", glued on) or
 * English ("Tambon ", see {@link englishPrefixFor}) — goes with it.
 * Separators left dangling at either end are trimmed.
 *
 * @param address - The prepared address string.
 * @param result - The row {@link getBestResult} chose.
 * @returns The trimmed remainder.
 */
export const cleanupAddress = (address: string, result: IExpanded): string => {
    const components = ADDRESS_COMPONENT_FIELDS.map((field) => ({
        value: result[field],
        englishPrefix: englishPrefixFor(field, result),
    }))
        .filter((component) => Boolean(component.value))
        .sort((a, b) => b.value.length - a.value.length);

    let remainder = address;
    for (const { value, englishPrefix } of components) {
        // Group 1 is the component's own English word, when it is present.
        const wholeWord = new RegExp(
            `(?:^|[\\s,]+)(${englishPrefix})?${ATTACHED_PREFIX}${escapeRegExp(value)}(?=$|[\\s,])`,
            'g',
        );
        const matches = [...remainder.matchAll(wholeWord)];
        // When two components share a name ("Amphoe Phra Nakhon Si Ayutthaya
        // Changwat Phra Nakhon Si Ayutthaya"), the occurrence introduced by
        // this component's own word is the one that belongs to it. Otherwise
        // components follow the house part, so take the last occurrence: a
        // house word with the same name ("หมู่บ้าน บางแค") must survive.
        const introduced = matches.filter((match) => match[1]);
        const pool = introduced.length > 0 ? introduced : matches;
        const chosen = pool[pool.length - 1];
        remainder =
            chosen?.index !== undefined
                ? remainder.slice(0, chosen.index) +
                  remainder.slice(chosen.index + chosen[0].length)
                : remainder.replace(` ${value}`, '');
    }
    return remainder.replace(/^[\s,]+|[\s,]+$/g, '');
};
