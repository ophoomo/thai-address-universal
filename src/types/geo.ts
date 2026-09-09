export interface IGeo {
    getData(): (number | boolean)[];
    load(): Promise<void>;
}
