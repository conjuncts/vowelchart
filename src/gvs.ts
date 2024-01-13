import * as d3 from "d3";
import { LexSnapshot, loadSnapshot } from "./snapshot";
import { vowelData } from "./main";
import { LexicalSet, lexsetData, updateLexsets, snapshots as oldSnapshots } from "./lexsets";
import { toggle } from "./tabs";

export let remapped = new Map<string, LexicalSet>();
export let snapshots = new Map<string, LexSnapshot>();
export let newLexsets = new Map<string, LexicalSet>();

function loadGVS() {
    return d3.tsv("snapshots/GVS.tsv").then((data) => {
        // remap lexsets
        let used: string[] = [];
        data.forEach((row: d3.DSVRowString<string>, idx: number) => {
            let orig = row['Name'];
            // some preprocessing of the name
            let name = orig;
            let end = name.indexOf(' (');
            if (end !== -1) {
                name = name.slice(0, end);
            }
            let lex = lexsetData.get(name);
            if (lex === undefined) {
                console.error("undefined lexical set. (Check the 'Name' column)", name);
                return;
            }
            if (used.includes(name)) {
                // it has been used before. we need to make a new one
                lex = lex.fork(); // do not reuse
                newLexsets.set(name, lex);
            } else {
                // if it hasn't been mapped before
                // we can reuse the old lexical set
                used.push(name);
            }
            lex.displayName = orig; // update. be sure to revert later. TODO implement displayName

            remapped.set(orig, lex);

            // position

        });
        return data;
    }).then((data) => {
        console.log("remapped lexsets", remapped);
        let ret = loadSnapshot(data, vowelData, remapped);
        for (let snapshot of ret) {
            snapshots.set(snapshot.name, snapshot);
        }
    });
}

export function toggleGVS(enable?: boolean) {
    if (enable === undefined) {
        enable = (document.getElementById('toggle-gvs') as HTMLInputElement).checked;
    }
    if (enable) {
        // let remapped = new Map<string, LexicalSet>();
        // let newLexsets = new Map<string, LexicalSet>();
        let actions = function() {
            moveTo(1600);
        }
        if(remapped.size === 0) {
            loadGVS().then(actions);
        } else {
            actions();
        }
    } else {
        // reverting
        console.log('revert');
        for(let [name, lexset] of lexsetData) {
            lexset.displayName = name;
        }
            
        // applySnapshot(oldSnapshots.RP!);
        // updateLexsets(lexsetData);
        toggle('RP');
        
    }
}

export function moveTo(date: number) {
    let snapshot = snapshots.get(date.toString());
    if(snapshot === undefined) {
        console.error("undefined snapshot", date);
        return;
    }
    for (let [lex, pos] of snapshot.data) {
        lex.position = pos;
    }
    updateLexsets(remapped);
}