export interface IWord {
    data: string[];
    lookup: string;
    words: string;
}

export interface IProvince {
    length: number;
    [index: number]: number | IDistrict[];
}

export interface IDistrict {
    length: number;
    [index: number]: number | ISubDistrict[];
}

export interface ISubDistrict {
    [index: number]: number;
}
