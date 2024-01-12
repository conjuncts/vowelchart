import { DSVRowString } from "d3";
import { LexicalSet, Lexsets } from "./lexsets";
import { AdjustedVowel, Diphthong, Vowel, isVowel, Vowels, vowelFromString, AdjustedPosition, isAdjustedPosition, Position, makeVowel } from "./vowels";


export class LexSnapshot {
    data: Map<LexicalSet, AdjustedPosition | Diphthong>;
    constructor(data: Map<LexicalSet, AdjustedPosition | Diphthong>) {
        this.data = data;
    }
    computeCollisions(v: Position, checkCollisionsWith?: Iterable<AdjustedPosition>) {
        if (checkCollisionsWith === undefined) {
            checkCollisionsWith = [];
            for (let pos of this.data.values()) {
                if (pos === undefined) continue;
                if (isAdjustedPosition(pos)) {
                    (checkCollisionsWith as AdjustedPosition[]).push(pos);
                }
            }
        }

        let atx = v.x;
        let aty = v.y;
        let textx = atx;
        let texty = aty;
        // prevent at same position
        for (let pos of checkCollisionsWith) {
            if (Math.abs(pos.x + pos.dx - textx) < 10 && Math.abs(pos.y + pos.dy - texty) < 10) {
                texty += 10; // works since duplicates are handled ascending
            }
        }
        return [textx - atx, texty - aty];
    }

    appendVowel(lex: LexicalSet, pos: AdjustedPosition | Vowel | Diphthong) {
        
        if(isAdjustedPosition(pos)) {
            this.data.set(lex, pos);
        } else if(isVowel(pos)) {
            let [dx, dy] = this.computeCollisions(pos);
            this.data.set(lex, new AdjustedVowel(pos, dx, dy));
        } else if(pos instanceof Diphthong) {
            // diphthong
            this.data.set(lex, pos);
        }
    }
}

function interpolateVowel(a: Vowel, b: Vowel, t: number): Vowel {
    let x = a.x + (b.x - a.x) * t;
    let y = a.y + (b.y - a.y) * t;
    let F1 = a.F1 + (b.F1 - a.F1) * t;
    let F2 = a.F2 + (b.F2 - a.F2) * t;
    let F3 = a.F3 + (b.F3 - a.F3) * t;
    return makeVowel("pos only", "pos only", F1, F2, F3, x, y);
}

/**
 * 
 * @param data 
 * @param vowelData 
 * @param keysIn Must be in the correct (chronological) order. Must all be present in the data.
 * @returns 
 */
export function loadSnapshot(data: d3.DSVRowArray<string>, vowelData: Vowels, lexsetData: Lexsets, keysIn?: string[]): LexSnapshot[] {

    let snapshots: LexSnapshot[] = [];
    
    
    let keys = keysIn === undefined ? data.columns.slice(1) : keysIn;
    
    for (let i = 0; i < keys.length; ++i) {
        let key = keys[i];
        if (data.columns.includes(key)) {
            snapshots.push(new LexSnapshot(new Map()));
        } else {
            console.error("missing column", key);
            throw new Error("missing column");
        }
    }

    if (keys === undefined) {
        keys = data.columns.slice(1);
    }
    // effectively take the transpose of the tsv
    data.forEach((row: DSVRowString<string>, idx: number) => {
        // let lex = lexsetData.get(row['Name']);
        // if(lex === undefined) {
        //     console.error("undefined lexical set. (Check the 'Name' column)", row['Name']);
        //     return;
        // }
        let name = row['Name'];
        let lex = lexsetData.get(name);
        if(lex === undefined) {
            console.error("undefined lexical set. (Check the 'Name' column)", name);
            return;
        }
        
            
        // some special handling for special characters
        let ellipsisFlag = false; // "..." means to fill with previous value
        let prev = undefined;
        let aboveFlag = false; // "↑" means to fill with row above
        
        // first pass of a row: fill out vowels
        for (let i = 0; i < keys.length; ++i) {

            // if (snapshots[i] === undefined) continue;
            let key = keys[i];            
            let val = row[key];
            if(val === "...") {
                ellipsisFlag = true;
            }
            if(val === "↑") {
                aboveFlag = true;
            }
            if(val === "/") {
                continue; // process interpolations on second pass
            }
            let vowel;
            if(ellipsisFlag) {
                if(prev === undefined) console.error('"..." at beginning of row');
                vowel = prev; 
            } else if(aboveFlag) {
                // cache hit issues?
                if(idx === 0) console.error('"↑" at beginning of table');
                let previousRow = data[idx - 1];
                let previousLex = lexsetData.get(previousRow['Name']);
                if(previousLex === undefined) {
                    console.error("undefined lexical set. (Check the 'Name' column)", previousRow['Name']);
                    return;
                }
                vowel = snapshots[i]!.data.get(previousLex!);
                if(vowel instanceof AdjustedVowel) vowel = vowel.vowel;
            } else {
                vowel = vowelFromString(val, vowelData);
            }
            
            if (vowel === undefined || (isVowel(vowel) && vowel.x === undefined)) {
                console.error('undefined vowel "' + row[key] + '"');
            }
            
            snapshots[i]!.appendVowel(lex, vowel!);
            
            prev = vowel;
        }
        
        // second pass of the same row: work on interpolations
        // work column by column
        for (let i = 1; i < keys.length; ++i) { // recall: i is the column index
            // starting cannot be interpolated
            // if (snapshots[i] === undefined) continue;
            let key = keys[i];

            let val = row[key];
            if (val === "/") {

                let prev = snapshots[i-1]!.data.get(lex); // since 
                if (prev === undefined) {
                    console.error("undefined vowel", name);
                    throw new Error("undefined vowel");
                }
                // look for the end of the interpolation
                let end;
                let j;
                for(j = i; j < keys.length; ++j) {
                    if(row[keys[j]] !== "/") {
                        end = snapshots[j]!.data.get(lex);
                        break;
                    }
                }
                if(end === undefined) {
                    console.error("intepolation has no end", name);
                    throw new Error("intepolation has no end");
                }
                // only calculate the mono to mono case for now
                if(isVowel(prev) && isVowel(end)) {
                    for(let k = i; k < j; ++k) {
                        let interp = new AdjustedVowel(
                            interpolateVowel(prev, end, (k - i) / (j - i)),
                            0, 0
                        );
                        snapshots[k]!.appendVowel(lex, interp);
                    }
                } else {
                    for(let k = i; k < j; ++k) {
                        snapshots[k]!.appendVowel(lex, prev);
                    }
                }
            }
        }
    });
    
    console.log("snapshots: ", snapshots);
    return snapshots;

}

function applySnapshot(snapshot: LexSnapshot, lexsetData: Lexsets) {
    for(let [lex, pos] of snapshot.data) {
        lex.position = pos;
    }
}