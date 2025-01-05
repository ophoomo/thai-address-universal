import { IExpanded, IExpandedWithPoint } from '../thai-address.d';

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

const fields: (keyof IExpanded)[] = ['district', 'amphoe', 'province'];

export const calculateMatchPoints = (
    element: IExpandedWithPoint,
    address: string,
): number => {
    const matches = fields.filter((field) =>
        address.includes(element[field] as string),
    );
    return matches.length;
};

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

export const cleanupAddress = (address: string, result: IExpanded): string => {
    fields.forEach((field) => {
        address = address.replace(new RegExp(`\\s${result[field]}`, 'g'), '');
    });
    return address.trim();
};
