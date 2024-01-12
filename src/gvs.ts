import * as d3 from "d3";
import { loadSnapshot } from "./snapshot";
import { vowelData } from "./main";
import { LexicalSet, lexsetData } from "./lexsets";

export function toggleGVS(enable?: boolean) {
    if (enable === undefined) {
        enable = (document.getElementById('toggle-gvs') as HTMLInputElement).checked;
    }
    if (enable) {
        let remapped = new Map<string, LexicalSet>();
        let newLexsets = new Map<string, LexicalSet>();
        d3.tsv("snapshots/GVS.tsv").then((data) => {
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
                if(used.includes(name)) {
                    // it has been used before. we need to make a new one
                    lex = lex.fork(); // do not reuse
                    newLexsets.set(name, lex);
                } else {
                    // if it hasn't been mapped before
                    // we can reuse the old lexical set
                    used.push(name);
                }
                lex.name = orig; // update. be sure to revert later. TODO implement displayName

                remapped.set(orig, lex);

                // position
            
            });
            return data;
        }).then((data) => {
            console.log("remapped lexsets", remapped);
            let ret = loadSnapshot(data, vowelData, remapped);
        });
    }
}