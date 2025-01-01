import { IExpanded, IExpandedWithPoint } from '../types';

export const prepareAddress = (address: string, zip: string): string => {
    address = address.replace(zip, '');
    address = address.replace('Thailand', '');
    address = address.replace('ต.', '');
    address = address.replace('อ.', '');
    address = address.replace('จ.', '');
    address = address.replace('ตำบล', '');
    address = address.replace('อำเภอ', '');
    address = address.replace('จังหวัด', '');
    address = address.replace('แขวง', '');
    address = address.replace('เขต', '');
    address = address.replace('แขวง.', '');
    address = address.replace('เขต.', '');
    address = address.replace(' กทม. ', ' กรุงเทพมหานคร ');
    address = address.replace(' กทม ', ' กรุงเทพมหานคร ');
    address = address.replace(' กรุงเทพ ', ' กรุงเทพมหานคร ');
    return address;
};

export const calculateMatchPoints = (
    element: IExpandedWithPoint,
    address: string,
): number => {
    const districtMatch = address.includes(element.district);
    const amphoeMatch = address.includes(element.amphoe);
    const provinceMatch = address.includes(element.province);

    return [districtMatch, amphoeMatch, provinceMatch].filter(Boolean).length;
};

export const getBestResult = (
    searchResult: IExpandedWithPoint[],
    address: string,
): IExpandedWithPoint | null => {
    const scoredResults = searchResult.map((element) => {
        const point = calculateMatchPoints(element, address);
        return { ...element, point };
    });

    scoredResults.sort((a, b) => b.point! - a.point!);

    if (scoredResults[0]?.point === 3) {
        return scoredResults[0];
    }
    return null;
};

export const cleanupAddress = (address: string, result: IExpanded): string => {
    address = address
        .replace(new RegExp(`\\s${result.district}`, 'g'), '')
        .replace(new RegExp(`\\s${result.amphoe}|เมือง`, 'g'), '')
        .replace(new RegExp(`\\s${result.province}`, 'g'), '');
    return address.trim();
};
