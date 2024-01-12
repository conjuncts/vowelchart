export interface AdjustedPosition {
    x: number;
    y: number;
    dx: number;
    dy: number;
}
export interface Vowel {
    filename: string;
    symbol: string;
    F1: number;
    F2: number;
    F3: number;
    rounded: boolean;
    show: boolean;
    frontness: number;
    openness: number;
    x: number;
    y: number;
}

export function makeVowel(filename: string, symbol: string, F1: number, F2: number, F3: number, x: number, y: number) {
    let v = {} as Vowel;    
    v.filename = filename;
    v.symbol = symbol;
    v.F1 = F1;
    v.F2 = F2;
    v.F3 = F3;
    v.rounded = filename.includes('_rounded');
    v.show = filename !== 'hidden.ogg.mp3';
    
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
    v.frontness = xi;
    v.openness = yi;
    
    v.x = x;
    v.y = y;
    return v;
    
}
export class AdjustedVowel<T extends Vowel = Vowel> implements AdjustedPosition {
    vowel: T;
    dx: number;
    dy: number;
    constructor(v: T, dx: number, dy: number) {
        this.vowel = v;
        this.dx = dx;
        this.dy = dy;
    }
    get x() {
        return this.vowel.x;
    }
    set x(x) {
        this.vowel.x = x;
    }
    get y() {
        return this.vowel.y;
    }
    set y(y) {
        this.vowel.y = y;
    }
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
export class SuffixedVowel implements Vowel {
    symbols: string;
    suffix: string;
    _inherit: Vowel;
    constructor(v: Vowel, suffix: string) {
        this._inherit = v;
        this.symbols = v.symbol + suffix;
        this.suffix = suffix;
        this.filename = v.filename;
        this.symbol = v.symbol;
        this.F1 = v.F1;
        this.F2 = v.F2;
        this.F3 = v.F3;
        this.rounded = v.rounded;
        this.frontness = v.frontness;
        this.openness = v.openness;
    }
    filename: string; // inherited properties not expected to change
    symbol: string;
    F1: number;
    F2: number;
    F3: number;
    rounded: boolean;
    frontness: number;
    openness: number;
    get x() { // changeable properties
        return this._inherit.x;
    }
    get y() {
        return this._inherit.y;
    }
    set x(x) {
        this._inherit.x = x;
    }
    set y(y) {
        this._inherit.y = y;
    }
    get show() {
        return this._inherit.show;
    }

}

let diacritics = '\u02F3\u0325\u0324\u032A\u02CC\u0329\u02EC\u032C\u02F7\u0330\u02FD\u033A\u032F\u02B0\u033C\u033B\u02D2\u0339\u02B7\u0303\u02B2\u02D3\u031C\u02D6\u031F\u207F\u00A8\u0308\u02E0\u02CD\u0320\u02E1\u02DF\u033D\u02E4\uAB6A\u0318\u02FA\u031A\u02D4\u031D\u0334\uAB6B\u0319\u02DE\u02D5\u031E\u02D0'.split('');

export function vowelFromString(s: string, vowelData: Vowels): 
        Vowel | SuffixedVowel | Diphthong | undefined {
    if (s.length === 1) {
        return vowelData[s]; // monophthong
    }
    if (s.length === 2) {
        let first = vowelData[s[0]];
        if(first === undefined) {
            return undefined;
        }
        if (s[1] === 'r') {
            return new SuffixedVowel(first, 'r');
        }
        if (s[1] === 'ː') {
            return new SuffixedVowel(first, 'ː');
        }
        if(diacritics.includes(s[1])) {
            return new SuffixedVowel(first, s[1]);
        }
        let second = vowelData[s[1]];
        if(second === undefined) {
            return undefined;
        }
        return new Diphthong(first, second, s);
    } else if (s.length === 3) {
        let recurse = vowelFromString(s.slice(0, 2), vowelData);
        if(!recurse) return undefined;
        if(recurse instanceof Diphthong) return recurse;
        if(s[2] === 'r' || s[2] === 'ː' || diacritics.includes(s[2])) {
            return new SuffixedVowel(recurse, s[2]);
        }
        return recurse;
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


export function adjustVowel<T extends Vowel>(vowel: T, // F1: number, F2: number, 
    checkCollisionsWith: Iterable<AdjustedPosition>): AdjustedVowel<Vowel & T>{

    let out = vowel;
    let textx = out.x;
    let texty = out.y;
    // prevent at same position
    for (let pos of checkCollisionsWith) {
        if (Math.abs(pos.x + pos.dx - textx) < 10 && Math.abs(pos.y + pos.dy - texty) < 10) {
            texty += 10; // works since duplicates are handled ascending
        }
    }

    // let position = new AdjustedPosition(atx, aty);
    // position.dx = (textx - atx);
    // position.dy = (texty - aty);
    
    return new AdjustedVowel(out, textx - out.x, texty - out.y);
}

export type Position = { x: number, y: number };
export function isPosition(x: any): x is Position {
    return x !== undefined && 
        x.x !== undefined && x.y !== undefined;
}

export function isAdjustedPosition(x: any): x is AdjustedPosition {
    return x !== undefined && 
        x.x !== undefined && x.y !== undefined && x.dx !== undefined && x.dy !== undefined;
}

export function isVowel(x: any): x is Vowel {
    return x !== undefined && x.filename !== undefined && x.symbol !== undefined
        && x.F1 !== undefined && x.F2 !== undefined && x.F3 !== undefined && isPosition(x);
}

export type MixedVowel = Vowel | Diphthong;

export enum VowelPositionState {
    FORMANT = 0,
    TRAPEZOID = 1
}

export type Vowels = Record<string, Vowel>;


export class PositionOnly implements Vowel{
    filename: string = '';
    symbol: string = '';
    F1: number = 0;
    F2: number = 0;
    F3: number = 0;
    rounded: boolean = false;
    show: boolean = false;
    frontness: number = 0;
    openness: number = 0;
    x: number;
    y: number;
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
    
}