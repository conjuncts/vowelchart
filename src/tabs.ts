
import * as d3 from 'd3';
import { AdjustedVowel, Diphthong, PositionedVowel, VowelPositionState } from './vowels';
import { lexsetData } from './lexsets';
import { positionLexset, repositionVowels } from './positioning';
import { vowelData, x as xAxis, y as yAxis, d3gs } from './main';
import { DiphthongScheduler } from './synthesis';

export enum Tab {
    HOME = 1,
    LEXSETS = 2,
    GVS = 3,
    MERGERS = 4
}
function enableTab(tab: Tab, enable: boolean) {
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
    return tab !== Tab.HOME;
}
function toggleDiphthongs(enable?: boolean) {
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

function toggleLexsets(enable?: boolean) {
    if (enable === undefined) {
        enable = isLexsetMode();
    }

    d3.selectAll('.lex-circle').transition()
        .duration(200)
        .attr("r", enable ? 20 : 0);
        
    // toggle lexset text
    // if diphs are enabled, we need to toggle the diphs
    // if not, we must exclude the diphs
    let selector = isDiphsChecked() ? '.lex-text' : '.lex-text:not(.lex-diph-text)';
    let x = d3.selectAll(selector);
    if(enable) {
        x.classed("hidden", false);
    }
    let y = x.transition()
        .duration(200)
        .style("opacity", enable ? "1" : "0");
    if(!enable) {
        y.on("end", function () {
            d3.select(this).classed("hidden", true);
        });
    }
    
    // toggle vowel text
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
                .style("fill", d => (d as PositionedVowel).rounded ? "blue" : "black");
        }, 100);
        for (let x of document.getElementsByClassName("lex-only")) {
            x.classList.add("hidden");
        }
    }
}

function toggleLexsetDiphs(enable: boolean) {
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

function toggleRP(enable?: boolean) {
    if (enable === undefined) {
        enable = (document.getElementById('toggle-rp') as HTMLInputElement).checked;
    }
    for (let lexset of lexsetData.values()) {
        let pos: AdjustedVowel | Diphthong | undefined;
        let was: AdjustedVowel | Diphthong | undefined;
        if (enable) {
            pos = lexset.RP;
            was = lexset.GA;
        } else {
            pos = lexset.GA;
            was = lexset.RP;
        }
        if(pos === undefined) continue;
        
        let node = positionLexset(lexset, pos, was);
        if(!RP_diphs && pos instanceof Diphthong && !(was instanceof Diphthong)) {
            let player = new DiphthongScheduler(pos.start, pos.end);
            node.append("path")
                .attr("d", d3.line()([[pos.start.x, pos.start.y], [pos.end.x, pos.end.y]]))
                .classed("diph-bounds", true)
                // hidden - animated
                .attr('stroke', 'white') // this just needs to be here
                .attr('stroke-opacity', 0)
                .attr('stroke-width', 10)
                .style("cursor", "pointer")
                .on("click", function () {
                    player.play();
                })
                .classed("RP-diph-bounds", true);
            node.classed("lex-diph", true);
        }
            
        
    }
    RP_diphs = true;
    d3.selectAll(".RP-diph-bounds")
        .classed("hidden", !enable);

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
        
        let label = enableTab(Tab.LEXSETS, false);
        
        label.title = "Lexical sets are not yet supported in trapezoid view";

        
    } else {
        for(let vowel of Object.values(vowelData)) {
            vowel.x = xAxis(vowel.F2);
            vowel.y = yAxis(vowel.F1);
            
        }
        repositionVowels(d3gs, VowelPositionState.FORMANT);
        
        // bring back the frontier
        d3.selectAll("#frontier").classed("hidden", false);

        let label = enableTab(Tab.LEXSETS, true);
        label.title = "";

    }
}