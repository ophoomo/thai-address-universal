import { LANGUAGE } from '../constants';
import type { ITranslate } from '../types/translate';
import { DatabaseFactory } from './database';

/** True when `text` starts with a Latin letter, i.e. it is an English name. */
const startsWithLatinLetter = (text: string): boolean => {
    const first = text.charAt(0).toLowerCase();
    return first >= 'a' && first <= 'z';
};

/**
 * Translates a single place name between Thai and English by looking it up in
 * the paired word tables of the two datasets. Direction is inferred from the
 * script of the input.
 */
export class Translate implements ITranslate {
    private thaiWords: string[] = [];
    private englishWords: string[] = [];

    /**
     * @param text - A place name in Thai or English.
     * @returns The name in the other language, or `text` unchanged when it has
     *          no counterpart (and `''` for empty input).
     */
    public async translateWord(text: string): Promise<string> {
        if (text.length === 0) {
            return '';
        }

        await this.loadWords();

        const fromEnglish = startsWithLatinLetter(text);
        const [source, target] = fromEnglish
            ? [this.englishWords, this.thaiWords]
            : [this.thaiWords, this.englishWords];

        const needle = fromEnglish ? text.toLowerCase().trim() : text;
        const index = source.findIndex((word) =>
            (fromEnglish ? word.toLowerCase().trim() : word).includes(needle),
        );

        return index === -1 ? text : target[index];
    }

    /** Loads both word tables once, on first use. */
    private async loadWords(): Promise<void> {
        if (this.thaiWords.length === 0) {
            this.thaiWords = (
                await DatabaseFactory.createDatabase(LANGUAGE.THAI)
            ).getWord();
        }
        if (this.englishWords.length === 0) {
            this.englishWords = (
                await DatabaseFactory.createDatabase(LANGUAGE.ENGLISH)
            ).getWord();
        }
    }
}
