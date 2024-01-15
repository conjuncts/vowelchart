import * as d3 from 'd3';
import { Diphthong, Vowels, Vowel, Adjustment } from './vowels';
import { LexSnapshot, applySnapshot, loadSnapshot } from './snapshot';
import { fadeInOut, fadeInOutAttr, updateLexsets } from './transition';

export class LexicalSet {
    name: string;
    displayName: string;
    // RP?: (Vowel | Diphthong);
    // GA?: (Vowel | Diphthong);
    position: (Vowel | Diphthong | undefined);
    adjustment: Adjustment = {dx: 0, dy: 0};
    examples: string[];
    constructor() {
        this.name = this.displayName = "";
        // this.RP = undefined;
        // this.GA = undefined;
        this.examples = [];
    }
    // isRhotic(): boolean {
        // return isRhotic(this.GA!);
    // }
    checked?: boolean;
    free?: boolean;
    diphthong?: boolean;
    weak?: boolean;
    rhotic?: boolean;
    
    fork() {
        let out = new LexicalSet();
        out.name = this.name;
        out.displayName = this.displayName;
        // out.RP = this.RP;
        // out.GA = this.GA;
        out.examples = this.examples;
        out.checked = this.checked;
        out.free = this.free;
        out.diphthong = this.diphthong;
        out.weak = this.weak;
        out.rhotic = this.rhotic;
        return out;
    }
}

export type Lexsets = Map<string, LexicalSet>;
export let lexsetData: Lexsets = new Map();


interface SnapshotHolder {
    RP?: LexSnapshot;
    GA?: LexSnapshot;
}
export let snapshots: SnapshotHolder = {};

export function toggleLexsetVisibility(enable: boolean) {
    // make async
    fadeInOutAttr(enable, d3.selectAll('.lex-circle'), "lex-hidden", "r", 0, 20, 200, "lex-toggle");

    // toggle lexset text
    // if diphs are enabled, we need to toggle the diphs
    // if not, we must exclude the diphs
    
    fadeInOut(enable, d3.selectAll('.lex-text'), "lex-hidden", "opacity", 0, 1, 200, "lex-toggle");

    // toggle vowel text
    if (enable) {
        setTimeout(() => {
            d3.selectAll(".vowel-text").style("fill", "#A9A9A9");
        }, 100);
        //     .style("fill", "#A9A9A9"); // "#4B8073");
        for (let x of document.getElementsByClassName("lex-only")) {
            x.classList.remove("lex-hidden");
        }
    } else {
        setTimeout(() => {
            d3.selectAll(".vowel-text")
                .style("fill", d => (d as Vowel).rounded ? "blue" : "black");
        }, 100);
        for (let x of document.getElementsByClassName("lex-only")) {
            x.classList.add("lex-hidden");
        }
    }
}


export function loadLexicalSets(vowelData: Vowels) {

    // load lexical sets
    d3.tsv("lexsets.tsv").then((data) => {
        data.forEach((d: any, idx: number) => {
            let lex = new LexicalSet();
            lex.name = lex.displayName = d["Name"];
            lex.examples = d['Examples'].split(', ');
            lex.checked = idx < 8; // KIT through CLOTH
            lex.free = 8 <= idx && idx < 13; // NURSE through THOUGHT
            lex.diphthong = 13 <= idx && idx < 18; // GOAT through MOUTH
            lex.weak = 18 <= idx && idx < 21; // PRICE through CHOICE
            lex.rhotic = 21 <= idx || lex.name === 'NURSE'; // NEAR through CURE and NURSE
            
            lexsetData.set(lex.name, lex);
        });
        
        let loaded = loadSnapshot(data, vowelData, lexsetData, ['RP', 'GA']);
        snapshots.RP = loaded[0];
        snapshots.GA = loaded[1];
        // snapshots.RP!.data.forEach((v, lex) => {
        //     lex.RP = v as Diphthong | Vowel;
        // });
        // snapshots.GA!.data.forEach((v, lex) => {
        //     lex.GA = v as Vowel;
            
        //     lex.position = v; //  instanceof Diphthong ? v : (v as AdjustedVowel).vowel;
        // });
        
        console.log('lexical sets:', lexsetData);
        applySnapshot(loaded[1]); // apply GA
        updateLexsets(lexsetData, false, true);
        return;
        
    });
}
