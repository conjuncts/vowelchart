
import * as d3 from 'd3';
import { AdjustedPosition, Diphthong, MixedVowel, Vowel, isPositionedVowel, isVowel } from './vowels';
import { LexicalSet, lexsetData } from './lexsets';
import { positionDiphText } from './positioning';

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
    d3.selectAll('.lex-text').transition()
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
    if(isDiphsChecked()) {
        toggleLexsetDiphs(enable);
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
function recalculateActiveTab() {
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


export function toggleRP(enable?: boolean) {
    if (enable === undefined) {
        enable = (document.getElementById('toggle-rp') as HTMLInputElement).checked;
    }
    function* yieldValues(): Generator<[LexicalSet, MixedVowel, MixedVowel],
        void, unknown> {
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
            if (pos instanceof Diphthong) {
                yield [lexset, pos, was] as [LexicalSet, Diphthong, MixedVowel];
                continue;
            } else if (isVowel(pos) && isPositionedVowel(pos)) {
                yield [lexset, pos, was] as [LexicalSet, Vowel & AdjustedPosition, MixedVowel];

            }

        }
    }
    for (let [lexset, pos, was] of yieldValues()) {
        let node = d3.select(`.lex-${lexset.name}`);

        if (pos instanceof Diphthong) {
            if (was instanceof Diphthong) {
                // diph to diph
                if (pos.start === was.start && pos.end === was.end) {
                    console.log("skipping");
                    continue;
                }
            } else {
                // mono to diph
                // animate the path
                let start = [pos.start.x, pos.start.y] as [number, number];
                let end = [pos.end.x, pos.end.y] as [number, number];
                let path = node.select(".lex-path")
                    .transition()
                    .duration(500)
                    .attr('d', d3.line()([start, end]))
                    .attr('stroke-opacity', 0.5)
                    .attr("marker-end", lexset.rhotic ?
                        "url(#diph-rho-arrowhead)" : "url(#diph-arrowhead)");
                
                // animate the text
                let [rotation, midpoint] = positionDiphText(pos);

                let txt = node.select(".lex-text")
                    .classed("lex-diph-text", true)
                    .classed("lex-text", false);
                if (lexset.name === "CURE") {
                    txt.attr('transform',
                        `rotate(${rotation}, ${was.x}, ${was.y})`); // animation is broken
                }
                let trans = txt.transition()
                    .duration(300);
                trans.attr("x", midpoint[0])
                    .attr("y", midpoint[1])
                    .attr('transform',
                        `rotate(${rotation}, ${midpoint[0]}, ${midpoint[1]})`)
                    .style("opacity", "1");
            }
        } else {
            // monophthong            
            if (was instanceof Diphthong) {
                // diph to mono
                let start = [pos.x, pos.y] as [number, number];
                node.select(".lex-path")
                    .transition()
                    .duration(500)
                    .attr('d', d3.line()([start, start]))
                    .attr('stroke-opacity', 0)
                    .attr("marker-end", null);
                
                // animate the text

                let txt = node.select(".lex-diph-text");
                if (lexset.name === "CURE") {
                    txt.attr('transform',
                        `rotate(0)`);
                }
                txt.classed("lex-diph-text", false)
                    .classed("lex-text", true)
                    .transition()
                    .duration(300)
                    .attr("x", pos.x)
                    .attr("y", pos.y)
                    .attr('transform',
                        `translate(${pos.dx + 5}, ${pos.dy + 10}) rotate(0, ${pos.x}, ${pos.y})`);
                continue;
            }
            // mono to mono
            node.select(".lex-text")
                .transition()
                .duration(300)
                .attr("x", pos.x)
                .attr("y", pos.y)
                .attr('transform',
                    `translate(${pos.dx + 5}, ${pos.dy + 10})`);

            // plot circles
            node.select(".lex-circle")
                .transition()
                .duration(200)
                .attr("cx", pos.x)
                .attr("cy", pos.y);
        }
    }

}