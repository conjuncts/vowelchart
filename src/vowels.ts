export type Vowel = {
    Filename: string;
    Symbol: string;
    F1: number;
    F2: number;
    F3: number;
}

export class Diphthong {
    Symbols: string;
    Start: Vowel;
    End: Vowel;
    constructor(start: Vowel, end: Vowel, symbols?: string) {
        this.Symbols =  (!symbols ? '' + start.Symbol + end.Symbol : symbols);
        this.Start = start;
        this.End = end;
    }
}

export class LexicalSet {
    Name: string;
    RP: (Vowel | Diphthong)[];
    GA: (Vowel | Diphthong)[];
    Examples: string[];
    constructor() {
        this.Name = "";
        this.RP = [];
        this.GA = [];
        this.Examples = [];
    }
}

