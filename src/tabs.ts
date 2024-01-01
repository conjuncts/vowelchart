
import * as d3 from 'd3';
import { Diphthong, Vowel, isPositionedVowel, isVowel } from './vowels';
import { lexsetData } from './lexsets';
import { createDiphthongPlayer, positionLexset } from './positioning';

export enum Tab {
    HOME = 1,
    LEXSETS = 2,
    GVS = 3,
    MERGERS = 4
}

export function toggle(key: string, enable: boolean) {
    switch (key) {
        case 'diphthongs':
            toggleDiphthongs(enable);
            break;
        case 'referenceRecordings':
            toggleReferenceRecordings(enable);
            break;
        default:
            console.error("Unknown toggle key: " + key);
    }
}

export function toggleReferenceRecordings(enable?: boolean) {
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
    return tab !== Tab.HOME;
}
export function toggleDiphthongs(enable?: boolean) {
    if (enable === undefined) {
        enable = isDiphsChecked();
    }
    // instantaneously disable cliakable diphthongs
    let bounds = document.querySelectorAll(".diph-bounds") as unknown as SVGCircleElement[];
    for (let bound of bounds) {
        if (enable) {
            bound.classList.remove("hidden");
        } else {
            bound.classList.add("hidden");
        }
    }
    // animate the paths
    d3.selectAll(".lex-path")
        .transition()
        .duration(200)
        .attr('stroke-opacity', enable ? 0.5 : 0);
    d3.selectAll(".diph-arrowhead")
        .transition()
        .duration(200)
        .attr('opacity', enable ? 0.5 : 0);
    if(isLexsetMode()) {
        toggleLexsetDiphs(enable);
    }
}

export function toggleLexsets(enable?: boolean) {
    if (enable === undefined) {
        enable = isLexsetMode();
    }

    d3.selectAll('.lex-circle').transition()
        .duration(200)
        .attr("r", enable ? 20 : 0);
    // if diphs are enabled, we need to toggle the diphs
    // if not, we must exclude the diphs
    let selector = isDiphsChecked() ? '.lex-text' : '.lex-text:not(.lex-diph-text)';
    d3.selectAll(selector).transition()
        .duration(200)
        .style("opacity", enable ? "1" : "0");
    if (enable) {
        setTimeout(() => {
            d3.selectAll(".vowel-text").style("fill", "#A9A9A9");
        }, 100);
        //     .style("fill", "#A9A9A9"); // "#4B8073");
        for(let x of document.getElementsByClassName("lex-only")) {
            x.classList.remove("hidden");
        }
    } else {
        setTimeout(() => {
            d3.selectAll(".vowel-text")
                .style("fill", d => (d as Vowel).rounded ? "blue" : "black");
        }, 100);
        for (let x of document.getElementsByClassName("lex-only")) {
            x.classList.add("hidden");
        }
    }
}

export function toggleLexsetDiphs(enable: boolean) {
    // isDiphsChecked AND LexsetMode on
    // d3.selectAll(".lex-diph-bounds")
    //     .transition()
    //     .duration(200)
    //     .attr('stroke-width', enable ? 20 : 0);
    
    d3.selectAll(".lex-diph-text")
        .transition()
        .duration(200)
        .style("opacity", enable ? "1" : "0");

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

let RP_diphs = false;

export function toggleRP(enable?: boolean) {
    if (enable === undefined) {
        enable = (document.getElementById('toggle-rp') as HTMLInputElement).checked;
    }
    for (let lexset of lexsetData.values()) {
        let pos;
        let was;
        if (enable) {
            pos = lexset.RP[0];
            was = lexset.GA[0];
        } else {
            pos = lexset.GA[0];
            was = lexset.RP[0];
        }
        if (pos instanceof Diphthong || (isVowel(pos) && isPositionedVowel(pos))) {
            if(was instanceof Diphthong || (isVowel(was) && isPositionedVowel(was))) {
                positionLexset(lexset, pos, was);
                if(!RP_diphs && pos instanceof Diphthong && !(was instanceof Diphthong)) {
                    createDiphthongPlayer(pos)
                        .classed("RP-diph-bounds", true);
                }
            }
        }
    }
    RP_diphs = true;
    d3.selectAll(".RP-diph-bounds")
        .classed("hidden", !enable);

}