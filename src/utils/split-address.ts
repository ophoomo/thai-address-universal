import { IExpanded, IExpandedWithPoint } from '../thai-address.d';

/**
 *
 */
const fields: (keyof IExpanded)[] = ['district', 'sub_district', 'province'];

/**
 *
 * @param address
 * @param zip
 * @returns
 */
export const prepareAddress = (address: string, zip: string): string => {
    const replacements = [
        zip,
        'Thailand',
        'ต.',
        'อ.',
        'จ.',
        'ตำบล',
        'อำเภอ',
        'จังหวัด',
        'แขวง',
        'เขต',
        'แขวง.',
        'เขต.',
        ' กทม. ',
        ' กทม ',
        ' กรุงเทพ ',
    ];
    replacements.forEach((replacement) => {
        address = address.replace(replacement, '');
    });
    address = address.replace(' กทม ', ' กรุงเทพมหานคร ');
    return address.trim();
};

/**
 *
 * @param element
 * @param address
 * @returns
 */
export const calculateMatchPoints = (
    element: IExpandedWithPoint,
    address: string,
): number => {
    const matches = fields.filter((field) =>
        address.includes(element[field] as string),
    );
    return matches.length;
};

/**
 *
 * @param searchResult
 * @param address
 * @returns
 */
export const getBestResult = (
    searchResult: IExpandedWithPoint[],
    address: string,
): IExpandedWithPoint | null => {
    const scoredResults = searchResult.map((element) => ({
        ...element,
        point: calculateMatchPoints(element, address),
    }));

    scoredResults.sort((a, b) => b.point! - a.point!);

    return scoredResults[0]?.point === 3 ? scoredResults[0] : null;
};

/**
 *
 * @param address
 * @param result
 * @returns
 */
export const cleanupAddress = (address: string, result: IExpanded): string => {
    return fields
        .reduce(
            (acc, field) =>
                acc.replace(new RegExp(`\\s${result[field]}`, 'g'), ''),
            address,
        )
        .trim();
};
