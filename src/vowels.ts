export interface AdjustedPosition extends Vowel {
    x: number;
    y: number;
    dx: number;
    dy: number;
}
export class Vowel {
    filename: string;
    symbol: string;
    F1: number;
    F2: number;
    F3: number;
    rounded: boolean;
    show: boolean;
    frontness: number;
    openness: number;
    constructor(filename: string, symbol: string, F1: number, F2: number, F3: number) {
        this.filename = filename;
        this.symbol = symbol;
        this.F1 = F1;
        this.F2 = F2;
        this.F3 = F3;
        this.rounded = filename.includes('_rounded');
        this.show = filename !== 'hidden.ogg.mp3';
        
        let xi = 0;
        if (filename.includes("_front_")) {
            xi = 4;
        } else if (filename.includes("_near-front_")) {
            xi = 3;
        } else if (filename.includes("_central_")) {
            xi = 2;
        } else if (filename.includes("_near-back_")) {
            xi = 1;
        }
        let yi = 0;
        if (filename.startsWith("Open_") || filename.startsWith("PR-open_")) {
            yi = 6;
        } else if (filename.startsWith("Near-open_")) {
            yi = 5;
        } else if (filename.startsWith("Open-mid_") || filename.startsWith("PR-open-mid_")) {
            yi = 4;
        } else if (filename.startsWith("Mid_")) {
            yi = 3;
        } else if (filename.startsWith("Close-mid_")) {
            yi = 2;
        } else if (filename.startsWith("Near-close_")) {
            yi = 1;
        }
        this.frontness = xi;
        this.openness = yi;
        
    }
}
export type PositionedVowel = (Vowel & AdjustedPosition);

export function isVowel(x: any): x is Vowel {
    return x.filename !== undefined && x.symbol !== undefined && x.F1 !== undefined && x.F2 !== undefined && x.F3 !== undefined;
}

export class Diphthong {
    symbols: string;
    start: PositionedVowel;
    end: PositionedVowel;
    constructor(start: PositionedVowel, end: PositionedVowel, symbols?: string) {
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



export function vowelFromString(s: string, formantData: Record<string, PositionedVowel>): Vowel | Diphthong | undefined {
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



export function positionVowel<T extends Vowel>(vowel: T, // F1: number, F2: number, 
    x: d3.ScaleLinear<number, number, never>,
    y: d3.ScaleLinear<number, number, never>,
    checkCollisionsWith: Iterable<AdjustedPosition>): T & AdjustedPosition{


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
    return x !== undefined && 
        x.x !== undefined && x.y !== undefined && x.dx !== undefined && x.dy !== undefined;
}


export type MixedVowel = PositionedVowel | Diphthong;

export enum VowelPositionState {
    FORMANT = 0,
    TRAPEZOID = 1
}