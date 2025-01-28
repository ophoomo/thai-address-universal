import { ITranslate } from '../types/translate';
import { DatabaseFactory } from './database';

export class Translate implements ITranslate {
    private thaiWords: string[] = [];
    private engWords: string[] = [];

    public constructor() {}

    /**
     * Translates a given word from English to Thai or vice versa.
     * @param text - The word to be translated.
     * @returns The translated word, or the original word if no translation is found.
     */
    public async translateWord(text: string): Promise<string> {
        if (text.length === 0) return '';

        await this.loadWords();

        let index = -1;
        const firstChar = text.charAt(0).toLowerCase();
        const checkEng = firstChar >= 'a' && firstChar <= 'z';

        if (checkEng) {
            const word = text.toLowerCase().trim();
            index = this.engWords.findIndex((item) =>
                item.toLowerCase().trim().includes(word),
            );
        } else {
            index = this.thaiWords.findIndex((item) => item.includes(text));
        }

        if (index === -1) return text;
        return checkEng ? this.thaiWords[index] : this.engWords[index];
    }

    /**
     * Loads Thai and English words from the database if they haven't been loaded yet.
     */
    private async loadWords(): Promise<void> {
        if (this.thaiWords.length === 0) {
            this.thaiWords = (
                await DatabaseFactory.createDatabase('thai')
            ).getWord();
        }
        if (this.engWords.length === 0) {
            this.engWords = (
                await DatabaseFactory.createDatabase('eng')
            ).getWord();
        }
    }
}
