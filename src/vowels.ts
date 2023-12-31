export class Vowel {
    filename: string;
    symbol: string;
    F1: number;
    F2: number;
    F3: number;
    rounded: boolean;
    show: boolean;
    constructor(filename: string, symbol: string, F1: number, F2: number, F3: number) {
        this.filename = filename;
        this.symbol = symbol;
        this.F1 = F1;
        this.F2 = F2;
        this.F3 = F3;
        this.rounded = filename.includes('_rounded');
        this.show = filename !== 'hidden.ogg.mp3';
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
    endpoints() {
        
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



export function vowelFromString(s: string, formantData: Record<string, Vowel>): Vowel | Diphthong | undefined {
    if (s.length === 1) {
        return formantData[s]; // monophthong
    }
    if (s.length === 2) {
        let first = formantData[s[0]];
        if(first === undefined) {
            return undefined;
        }
        if (s[1] === 'r') {
            return new SuffixedVowel(first, 'r');
        }
        if (s[1] === 'ː') {
            return new SuffixedVowel(first, 'ː');
        }
        let second = formantData[s[1]];
        if(second === undefined) {
            return undefined;
        }
        return new Diphthong(first, second, s);
    }
    throw new Error("Invalid string: " + s);
}

export function isRhotic(x: any): x is SuffixedVowel {
    return x.suffix === 'r';
}

export let diphs = `e ɪ
ä ɪ
ɔ ɪ
ä ʊ
o ʊ̝`.split("\n").map((x) => x.split(' '));
// ä j
// ʊ

export interface AdjustedPosition extends Vowel {
    x: number;
    y: number;
    dx: number;
    dy: number;
}

export function positionVowel<T extends Vowel>(vowel: T, // F1: number, F2: number, 
    x: d3.ScaleLinear<number, number, never>,
    y: d3.ScaleLinear<number, number, never>,
    checkCollisionsWith: Iterable<AdjustedPosition>): T & AdjustedPosition {


    let atx = x(vowel.F2);
    let aty = y(vowel.F1);
    let textx = atx;
    let texty = aty;
    // prevent at same position
    for (let pos of checkCollisionsWith) {
        if (Math.abs(pos.x + pos.dx - textx) < 10 && Math.abs(pos.y + pos.dy - texty) < 10) {
            texty += 10; // works since duplicates are handled ascending
        }
    }

    // let position = new AdjustedPosition(atx, aty);
    // position.dx = (textx - atx);
    // position.dy = (texty - aty);
    let out = Object.assign({}, vowel) as (T & AdjustedPosition);
    out.x = atx;
    out.y = aty;
    out.dx = (textx - atx);
    out.dy = (texty - aty);
    return out;
}

export function isPositionedVowel(x: any): x is AdjustedPosition {
    return x.x !== undefined && x.y !== undefined && x.dx !== undefined && x.dy !== undefined;
}

export type PositionedVowel = (Vowel & AdjustedPosition);
export type MixedVowel = PositionedVowel | Diphthong;
