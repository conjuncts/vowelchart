import * as d3 from "d3";
import { LexSnapshot, loadSnapshot } from "./snapshot";
import { vowelData } from "./main";
import { LexicalSet, lexsetData, updateLexsets} from "./lexsets";
import { isDiphsChecked, toggle } from "./tabs";

export let remapped = new Map<string, LexicalSet>();
export let snapshots = new Map<string, LexSnapshot>();

function loadGVS() {
    return d3.tsv("snapshots/GVS.tsv").then((data) => {
        // remap lexsets
        let used: Map<string, number> = new Map();
        data.forEach((row: d3.DSVRowString<string>) => {
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
            lex = lex.fork(); // always reuse
            let alias = name;
            if (used.has(name)) {
                // it has been used before. we need to change up the name
                alias += used.get(name)
                lex.name = alias; // do not duplicate names
                used.set(name, used.get(name)! + 1);
            } else {
                // if it hasn't been mapped before
                // we can reuse the old lexical set
                used.set(name, 1);
            }
            lex.displayName = orig;
            remapped.set(orig, lex);

        });
        return data;
    }).then((data) => {
        console.log("remapped lexsets", remapped);
        let ret = loadSnapshot(data, vowelData, remapped);
        for (let snapshot of ret) { // store snapshots for later use
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
            moveTo(2000);
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
    updateLexsets(remapped, true, isDiphsChecked());
}

document.getElementById('gvs-slider')!.addEventListener('change', (e) => {
    let date = (document.getElementById('gvs-slider') as HTMLInputElement).valueAsNumber;
    if(!(date % 50 === 0)) return;
    moveTo(date);
});