export class Vowel {
    filename: string;
    symbol: string;
    F1: number;
    F2: number;
    F3: number;
    constructor(filename: string, symbol: string, F1: number, F2: number, F3: number) {
        this.filename = filename;
        this.symbol = symbol;
        this.F1 = F1;
        this.F2 = F2;
        this.F3 = F3;
    }
}

export function isVowel(x: any): x is Vowel {
    return x.filename !== undefined && x.symbol !== undefined && x.F1 !== undefined && x.F2 !== undefined && x.F3 !== undefined;
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

/**
 * Two types: rhotic and longened
 */
export class SuffixedVowel extends Vowel {
    symbols: string;
    suffix: string;
    constructor(v: Vowel, suffix: string) {
        super(v.filename, v.symbol, v.F1, v.F2, v.F3);
        this.symbols = v.symbol + suffix;
        this.suffix = suffix;
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
    isRhotic(): boolean {
        return isRhotic(this.GA[0]);
    }
    checked?: boolean;
    free?: boolean;
    diphthong?: boolean;
    weak?: boolean;
    rhotic?: boolean;
}

export function vowelFromString(s: string, formantData: Record<string, Vowel>): Vowel | Diphthong {
    if (s.length === 1) {
        return formantData[s]; // monophthong
    }
    if (s.length === 2) {
        if (s[1] === 'r') {
            return new SuffixedVowel(formantData[s[0]], 'r');
        }
        if (s[1] === 'ː') {
            return new SuffixedVowel(formantData[s[0]], 'ː');
        }
        return new Diphthong(formantData[s[0]], formantData[s[1]], s);
    }
    throw new Error("Invalid string: " + s);
}

export function isRhotic(x: any): x is SuffixedVowel {
    return x.suffix === 'r';
}