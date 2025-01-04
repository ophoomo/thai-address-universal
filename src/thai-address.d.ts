export interface IThaiAddress {
    data: any;
    lookup: string;
    words: string;
}

export interface IExpanded {
    district: string;
    amphoe: string;
    province: string;
    zipcode: string;
    district_code?: string;
    amphoe_code?: string;
    province_code?: string;
}

export interface IExpandedWithPoint extends IExpanded {
    point?: number;
}
