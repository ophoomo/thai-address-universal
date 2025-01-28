export interface ITranslate {
    translateWord(text: string): Promise<string>;
}
