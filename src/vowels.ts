export interface AdjustedPosition {
    x: number;
    y: number;
    dx: number;
    dy: number;
}
export class FreeVowel {
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
    constructor(filename: string, symbol: string, F1: number, F2: number, F3: number, x: number, y: number) {
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
        
        this.x = x;
        this.y = y;
        
    }
}
export type Position = { x: number, y: number };
export type PositionedVowel = (FreeVowel & Position);
export class AdjustedVowel<T extends PositionedVowel = PositionedVowel> implements AdjustedPosition {
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

export function isFreeVowel(x: any): x is FreeVowel {
    return x !== undefined && x.filename !== undefined && x.symbol !== undefined 
    && x.F1 !== undefined && x.F2 !== undefined && x.F3 !== undefined;
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
export class SuffixedVowel implements PositionedVowel {
    symbols: string;
    suffix: string;
    _inherit: PositionedVowel;
    constructor(v: PositionedVowel, suffix: string) {
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



export function vowelFromString(s: string, formantData: Record<string, PositionedVowel>): 
        PositionedVowel | SuffixedVowel | Diphthong | undefined {
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


type Axis = d3.ScaleLinear<number, number, never>;

export function plopVowel<T extends FreeVowel>(vowel: T, x: Axis, y: Axis): PositionedVowel & T {
    let out = vowel as T & PositionedVowel;
    out.x = x(vowel.F2);
    out.y = y(vowel.F1);
    return out;
}

export function adjustVowel<T extends FreeVowel>(vowel: T, // F1: number, F2: number, 
    x: Axis,
    y: Axis,
    checkCollisionsWith: Iterable<AdjustedPosition>): AdjustedVowel<PositionedVowel & T>{

    let out = plopVowel(vowel, x, y);
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

export function isPosition(x: any): x is Position {
    return x !== undefined && 
        x.x !== undefined && x.y !== undefined;
}

export function isVowel(x: any): x is PositionedVowel {
    return isFreeVowel(x) && isPosition(x);
}

export type MixedVowel = PositionedVowel | Diphthong;

export enum VowelPositionState {
    FORMANT = 0,
    TRAPEZOID = 1
}
