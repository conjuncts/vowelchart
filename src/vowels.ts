export type Vowel = {
    filename: string;
    symbol: string;
    F1: number;
    F2: number;
    F3: number;
}

export class Diphthong {
    symbols: string;
    start: Vowel;
    end: Vowel;
    constructor(start: Vowel, end: Vowel, symbols?: string) {
        this.symbols =  (!symbols ? '' + start.symbol + end.symbol : symbols);
        this.start = start;
        this.end = end;
    }
}

export class LexicalSet {
    name: string;
    RP: (Vowel | Diphthong)[];
    GA: (Vowel | Diphthong)[];
    examples: string[];
    constructor() {
        this.name = "";
        this.RP = [];
        this.GA = [];
        this.examples = [];
    }
}

