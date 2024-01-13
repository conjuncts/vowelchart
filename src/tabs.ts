
import * as d3 from 'd3';
import { AdjustedVowel, Diphthong, Vowel, VowelPositionState } from './vowels';
import { lexsetData, toggleLexsetVisibility, updateLexsets } from './lexsets';
import { positionLexset, repositionVowels } from './positioning';
import { vowelData, x as xAxis, y as yAxis, d3gs } from './main';
import { DiphthongScheduler } from './synthesis';
import { toggleGVS } from './gvs';
import { fadeInOut } from './transition';

export enum Tab {
    HOME = 1,
    LEXSETS = 2,
    GVS = 3,
    MERGERS = 4
}
function unblockTab(tab: Tab, enable: boolean) {
    let inp = document.getElementById(`radio-${tab}`) as HTMLInputElement;
    let label = inp.nextElementSibling as HTMLLabelElement;
    inp.disabled = !enable;
    if(enable) {
        label.classList.remove("blocked");
    } else {
        label.classList.add("blocked");
    }
    return label;
}
export function toggle(key: string, enable?: boolean) {
    switch (key) {
        case 'diphthongs':
            toggleDiphthongs(enable);
            break;
        case 'referenceRecordings':
            toggleReferenceRecordings(enable);
            break;
        case 'RP':
            toggleRP(enable);
            break;
        case 'trapezoid':
            toggleTrapezoid(enable);
            break;
        case 'GVS':
            toggleGVS(enable);
            break;
        default:
            console.error("Unknown toggle key: " + key);
    }
}

function toggleReferenceRecordings(enable?: boolean) {
    if(enable === undefined) {
        
        enable = (document.getElementById('play-reference') as HTMLInputElement).checked;
    }
    let referenceRecordings = document.getElementsByClassName("vowel-bounds") as unknown as SVGCircleElement[];
    for(let ref of referenceRecordings) {
        if(enable) {
            ref.style.removeProperty("display");
        } else {
            ref.style.display = "none";

        }
    }
}
function isDiphsChecked() {
    return (document.getElementById('toggle-diphs') as HTMLInputElement).checked;
}
function isLexsetMode(tab?: Tab) {
    if(tab === undefined) {
        tab = activeTab;
    }
    return tab !== Tab.HOME; // && tab !== Tab.GVS;
}


function toggleDiphthongs(enable?: boolean) {
    if (enable === undefined) {
        enable = isDiphsChecked();
    }
    // instantaneously disable cliakable diphthongs
    let bounds = document.querySelectorAll(".diph-bounds") as unknown as SVGCircleElement[];
    for (let bound of bounds) {
        if (enable) {
            bound.classList.remove("diph-hidden");
        } else {
            bound.classList.add("diph-hidden");
        }
    }
    // animate the paths
    fadeInOut(enable, d3.selectAll(".diph-tog-arrowhead"), "diph-hidden", "opacity", 0, 0.5, 200);
    fadeInOut(enable, d3.selectAll(".diph-tog"), "diph-hidden", "opacity", 0, 1, 200);
    
    fadeInOut(enable, d3.selectAll(".lex-path"), "diph-hidden", "stroke-opacity", 0, 0.5, 200);
    // fadeInOut(enable, d3.selectAll(".diph-arrowhead"), "diph-hidden", "opacity", 0.5, 200);
    
    // if(isLexsetMode()) {
    //     toggleLexsetDiphs(enable);
    // }
}

function toggleLexsets(enable?: boolean) {
    if (enable === undefined) {
        enable = isLexsetMode();
    }

    toggleLexsetVisibility(enable);
}

let activeTab = Tab.HOME;
export function hydrateTabs() {
    document.getElementById('radio-1')?.addEventListener('change', function () {
        enterTab(Tab.HOME, activeTab);
    });
    document.getElementById('radio-2')?.addEventListener('change', function () {
        enterTab(Tab.LEXSETS, activeTab);
    });
    document.getElementById('radio-3')?.addEventListener('change', function () {
        enterTab(Tab.GVS, activeTab);
    });
    document.getElementById('radio-4')?.addEventListener('change', function () {
        enterTab(Tab.MERGERS, activeTab);
    });
    // console.log("hydrate");
    // activeTab = recalculateActiveTab();
    // if(activeTab !== Tab.HOME) {
    //     enterTab(activeTab, Tab.HOME);
    // }
    
}
function enterTab(tab: Tab, from: Tab) {
    console.log("entering", tab, "from", from);
    if(tab === from) {
        return;
    }
    if(tab === Tab.HOME) {
        for (let x of document.getElementsByClassName("home-only")) {
            x.classList.remove("hidden");
        }
    }
    if(from === Tab.HOME) {
        for (let x of document.getElementsByClassName("home-only")) {
            x.classList.add("hidden");
        }
    }
    if(isLexsetMode(tab) !== isLexsetMode(from)) {
        console.log("toggling lexsets");
        toggleLexsets(isLexsetMode(tab));
    }
    if(tab === Tab.GVS) {
        for (let x of document.getElementsByClassName("gvs-only")) x.classList.remove("hidden");
        toggleGVS(true);
    }
    if(from === Tab.GVS) {
        for (let x of document.getElementsByClassName("gvs-only")) x.classList.add("hidden");
        toggleGVS(false);
    }
    activeTab = tab;
}
export function recalculateActiveTab() {
    let tab = Tab.HOME;
    if((document.getElementById('radio-2') as HTMLInputElement).checked) {
        tab = Tab.LEXSETS;
    } else if((document.getElementById('radio-3') as HTMLInputElement).checked) {
        tab = Tab.GVS;
    } else if((document.getElementById('radio-4') as HTMLInputElement).checked) {
        tab = Tab.MERGERS;
    }
    return tab;
}

// let RP_diphs = false;

function toggleRP(enable?: boolean) {
    if (enable === undefined) {
        enable = (document.getElementById('toggle-rp') as HTMLInputElement).checked;
    }
    
    for(let lexset of lexsetData.values()) {
        if (enable) 
            lexset.position = lexset.RP;
        else
            lexset.position = lexset.GA;
    }
    updateLexsets(lexsetData, isLexsetMode(), isDiphsChecked());
    
    // for (let lexset of lexsetData.values()) {
    //     let pos: AdjustedVowel | Diphthong | undefined;
    //     let was: AdjustedVowel | Diphthong | undefined;
    //     if (enable) {
    //         pos = lexset.RP;
    //         was = lexset.GA;
    //     } else {
    //         pos = lexset.GA;
    //         was = lexset.RP;
    //     }
    //     if(pos === undefined) continue;
        
    //     let node = positionLexset(lexset, pos, was);
    //     if(!RP_diphs && pos instanceof Diphthong && !(was instanceof Diphthong)) {
    //         let player = new DiphthongScheduler(pos.start, pos.end);
    //         node.append("path")
    //             .attr("d", d3.line()([[pos.start.x, pos.start.y], [pos.end.x, pos.end.y]]))
    //             .classed("diph-bounds", true)
    //             // hidden - animated
    //             .attr('stroke', 'white') // this just needs to be here
    //             .attr('stroke-opacity', 0)
    //             .attr('stroke-width', 10)
    //             .style("cursor", "pointer")
    //             .on("click", function () {
    //                 player.play();
    //             })
    //             .classed("RP-diph-bounds", true);
    //         node.classed("lex-diph", true);
    //     }
            
        
    // }
    // RP_diphs = true;
    // d3.selectAll(".RP-diph-bounds")
    //     .classed("hidden", !enable);

}
function toggleTrapezoid(enable?: boolean) {
    if(!enable) enable = (document.getElementById('toggle-trapezoid') as HTMLInputElement).checked;
    if(enable) {
        // reposition all vowels
        for(let vowel of Object.values(vowelData)) {
            // bottom distance: 493px :: 370.93 -- about 50%
            // top distance: 979px :: 736.6
            // vertical distance: 731px :: 550.
            
            let y = 250 + (vowel.openness / 6) * (800 - 250);
            let x = 600 + (vowel.frontness / 4) * (2400 - 600) * (1 - 1/2 * vowel.openness / 6);
            
            x += (vowel.rounded ? -20 : 20);
            
            vowel.x = xAxis(x);
            vowel.y = yAxis(y);
            
            // vowel.x = vowel.xTrapezoid;
            // vowel.y = vowel.yTrapezoid;
            
        }
        repositionVowels(d3gs, VowelPositionState.TRAPEZOID);
        
        // take away the frontier
        d3.selectAll("#frontier").classed("hidden", true);
        
        let label = unblockTab(Tab.LEXSETS, false);
        label.title = "Lexical sets are not yet supported in trapezoid view";
        label = unblockTab(Tab.GVS, false);
        label.title = "Great Vowel Shift is not yet supported in trapezoid view";
        
    } else {
        for(let vowel of Object.values(vowelData)) {
            vowel.x = xAxis(vowel.F2);
            vowel.y = yAxis(vowel.F1);
            
        }
        repositionVowels(d3gs, VowelPositionState.FORMANT);
        
        // bring back the frontier
        d3.selectAll("#frontier").classed("hidden", false);

        let label = unblockTab(Tab.LEXSETS, true);
        label.title = "";
        label = unblockTab(Tab.GVS, true);
        label.title = "";

    }
}

