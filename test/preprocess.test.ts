import { IProvince, IWord } from '../src/types/preprocess.d';
import { preprocess, preprocess_word } from '../src/utils/preprocess';

describe('Preprocess Word Test', () => {
    it('should return the text as string when useLookup is true', () => {
        const data = {
            data: [0],
            lookup: 'C',
            words: 'คลอง|ท่อม|กระบี่|เหนือ|ใต้|พน',
        };
        const result = preprocess_word(data);
        expect(result).toEqual(['กระบี่']);
    });

    it('should return the text as string when useLookup is false', () => {
        const data = {
            data: ['กระบี่'],
        };
        const result = preprocess_word(data);
        expect(result).toEqual(['กระบี่']);
    });

    it('should return an empty array when data is empty', () => {
        const data: IWord = {
            data: [],
            lookup: '',
            words: '',
        };

        const result = preprocess_word(data);
        expect(result).toEqual([]);
    });

    it('should transform text based on lookup and words data for Thai characters', () => {
        const data: IWord = {
            data: ['C', 'AB', 'ABD', 'ABE', 'AF'],
            lookup: '',
            words: 'คลอง|ท่อม|กระบี่|เหนือ|ใต้|พน',
        };

        const result = preprocess_word(data);
        expect(result).toEqual([
            'กระบี่',
            'คลองท่อม',
            'คลองท่อมเหนือ',
            'คลองท่อมใต้',
            'คลองพน',
        ]);
    });

    it('should transform text based on lookup and words data for Eng characters', () => {
        const data: IWord = {
            data: ['ฃ', 'ก ข', 'ก ข ค', 'ก ข ฅ', 'ก ฆ'],
            lookup: '',
            words: 'Khlong|Thom|Krabi|Nuea|Tai|Phon',
        };

        const result = preprocess_word(data, true);
        expect(result).toEqual([
            'Krabi',
            'Khlong Thom',
            'Khlong Thom Nuea',
            'Khlong Thom Tai',
            'Khlong Phon',
        ]);
    });
});

describe('Preprocess Test', () => {
    it('should return an empty array when data is empty', () => {
        const words = [
            'กระบี่',
            'คลองท่อม',
            'คลองท่อมเหนือ',
            'คลองท่อมใต้',
            'คลองพน',
        ];

        const data: IProvince[] = [];
        const result = preprocess(data, words);
        expect(result).toEqual([]);
    });

    const data: IProvince[] = [
        [
            0,
            [
                [
                    1,
                    [
                        [2, 81120],
                        [3, 81120],
                        [4, 81170],
                    ],
                ],
            ],
        ],
    ];

    const geo: (number | boolean)[] = [10, 71, false, 1000, 2000];

    it('should transform text based on words and data for Thai Address', () => {
        const words = [
            'กระบี่',
            'คลองท่อม',
            'คลองท่อมเหนือ',
            'คลองท่อมใต้',
            'คลองพน',
        ];

        const result = preprocess(data, words);
        expect(result.length).toBe(3);
    });

    it('should transform text based on words and data for Eng Address', () => {
        const words = [
            'Krabi',
            'Khlong Thom',
            'Khlong Thom Nuea',
            'Khlong Thom Tai',
            'Khlong Phon',
        ];

        const result = preprocess(data, words);
        expect(result.length).toBe(3);
    });

    it('should transform text based on words and data for Thai Address with Geo Data', () => {
        const words = [
            'กระบี่',
            'คลองท่อม',
            'คลองท่อมเหนือ',
            'คลองท่อมใต้',
            'คลองพน',
        ];

        const result = preprocess(data, words, geo);
        expect(result.length).toBe(3);
        expect(result[0].province_code).toBe('10');
        expect(result[0].district_code).toBe('71');
        expect(result[0].sub_district_code).toBe('');
        expect(result[1].sub_district_code).toBe('1000');
    });

    it('should transform text based on words and data for Eng Address with Geo Data', () => {
        const words = [
            'Krabi',
            'Khlong Thom',
            'Khlong Thom Nuea',
            'Khlong Thom Tai',
            'Khlong Phon',
        ];

        const result = preprocess(data, words, geo);
        expect(result.length).toBe(3);
        expect(result[0].province_code).toBe('10');
        expect(result[0].district_code).toBe('71');
        expect(result[0].sub_district_code).toBe('');
        expect(result[1].sub_district_code).toBe('1000');
    });
});
