export interface IExpanded {
    province_code?: string;
    province: string;
    district_code?: string;
    district: string;
    sub_district_code?: string;
    sub_district: string;
    postal_code: string;
    /**
     * Only populated on the object returned by `splitAddress` — the leftover
     * part of the input string after the matched province / district /
     * sub-district (and the postal code) have been stripped out.
     */
    address?: string;
}

export interface IExpandedWithPoint extends IExpanded {
    point?: number;
}
