import * as d3 from 'd3';
import { Diphthong, isRhotic, AdjustedVowel, Vowels, AdjustedPosition, isAdjustedPosition, Vowel } from './vowels';
import { DiphthongScheduler } from './synthesis';
import { positionDiphText } from './positioning';
import { LexSnapshot, loadSnapshot } from './snapshot';
import { fadeInOut, fadeInOutAttr } from './transition';

export class LexicalSet {
    name: string;
    displayName: string;
    RP?: (AdjustedVowel | Diphthong);
    GA?: (AdjustedVowel | Diphthong);
    position: (AdjustedPosition | Diphthong | undefined);
    examples: string[];
    constructor() {
        this.name = this.displayName = "";
        this.RP = undefined;
        this.GA = undefined;
        this.examples = [];
    }
    isRhotic(): boolean {
        return isRhotic(this.GA!);
    }
    checked?: boolean;
    free?: boolean;
    diphthong?: boolean;
    weak?: boolean;
    rhotic?: boolean;
    
    fork() {
        let out = new LexicalSet();
        out.name = this.name;
        out.displayName = this.displayName;
        out.RP = this.RP;
        out.GA = this.GA;
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

export let d3data: d3.Selection<SVGGElement, LexicalSet, d3.BaseType, unknown>;

interface SnapshotHolder {
    RP?: LexSnapshot;
    GA?: LexSnapshot;
}
export let snapshots: SnapshotHolder = {};

export function toggleLexsetVisibility(enable: boolean) {

    fadeInOutAttr(enable, d3.selectAll('.lex-circle'), "lex-hidden", "r", 0, 20, 200);

    // toggle lexset text
    // if diphs are enabled, we need to toggle the diphs
    // if not, we must exclude the diphs
    
    fadeInOut(enable, d3.selectAll('.lex-text'), "lex-hidden", "opacity", 0, 1, 200);

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

// let lexsetPositions: Map<string, PositionedVowel> = new Map();
// normal: 200
// debug: 1000
export function updateLexsets(lexsetData: Lexsets, showLex = true, showDiphs = true, transition=200) {
    // showDiphs is only relevant when creating new nodes so we can apply the diph-hidden filter
    // how diphs are toggled: 
    // 1. lex-path stroke opacity
    // 2. diph-arrowhead toggle
        
    let update = d3.select("#svg-lex")
        .selectAll<SVGGElement, LexicalSet>("g")
        .data([...lexsetData.values()], (d: LexicalSet) => d.name);
    
    console.log("update lexset");
    update.exit().remove();
        
    // new node initialization
    let newNodes = update.enter()
        .append("g")
        .classed("lexset", true);
    newNodes.each(function(lexset) {
        this.classList.add(`lex-${lexset.name}`);
        // only give the right of canonical named classes to the original lexsets
        
        let ele = lexset.GA;
        if (ele instanceof Diphthong) {
            this.classList.add("lex-diph");
        } else if (ele instanceof AdjustedVowel) {
            // pass
        } else {
            console.log("neither diph nor pos", lexset.name);
            return;
        }
        lexset.position = ele;
    });
    
    // new paths. paths are exception to diph-togglable
    let newP = newNodes.append("path")
        .classed("lex-path", true)
        .attr('stroke-dasharray', '10,10')
        .each(function (lexset) {
            let isdiph = lexset.position instanceof Diphthong;
            let path = d3.select(this);
            if (isdiph) {
                let diph = lexset.position as Diphthong;
                path.attr("d", d3.line()([[diph.start.x, diph.start.y], [diph.end.x, diph.end.y]]))
                    .attr('stroke-opacity', showDiphs ? 0.5 : 0);
                // if(!showDiphs) path.classed("diph-hidden", true);
            } else if (isAdjustedPosition(lexset.position)) {
                let pos = lexset.position as AdjustedPosition;
                path.attr("d", d3.line()([[pos.x, pos.y], [pos.x, pos.y]]))
                    .attr('stroke-opacity', 0.5);
            }
            path.attr('stroke', lexset.rhotic ? 'darkorchid' : '#3b3bb3');
        })
        .attr("marker-end", function (lexset) {
            if (lexset.position instanceof Diphthong) {
                return lexset.rhotic ? "url(#diph-rho-arrowhead)" : "url(#diph-arrowhead)"
            }
            return null;
        });
    if(showLex && showDiphs) {
        newP.transition().duration(transition * 5/2)
            .attr('stroke-opacity', lexset => 
                lexset.position instanceof Diphthong ? 0.5 : 0); // animated
    }
    
    // new circles
    let newC = newNodes.append("circle")
        .classed("lex-circle", true)
        .style("fill", "#69b3a222")
        .classed("lex-unused", lexset => lexset.position instanceof Diphthong)
        .filter(lexset => isAdjustedPosition(lexset.position))
        .attr("cx", lexset => (lexset.position as AdjustedPosition).x)
        .attr("cy", lexset => (lexset.position as AdjustedPosition).y)
        .attr("r", 0); // animated
    if(showLex) {
        newC.transition().duration(transition)
            .attr("r", 20);
    }
    
    // new text
    let newT = newNodes.append("text")
        .classed("lex-text", true)
        .classed("diph-tog", lexset => lexset.position instanceof Diphthong)
        .classed("diph-hidden", lexset => lexset.position instanceof Diphthong && !showDiphs)
        .text(lexset => lexset.displayName)
        .style("opacity", 0) // animated
        .each(function (lexset) {
            let x;
            let y;
            let transform;
            if(lexset.position instanceof Diphthong) {
                let [rotation, midpoint] = positionDiphText(lexset.position);
                // if(!showDiphs) d3.select(this).classed("diph-hidden", true);
                x = midpoint[0];
                y = midpoint[1];
                transform = `rotate(${rotation}, ${midpoint[0]}, ${midpoint[1]})`;
            } else {
                let pos = lexset.position as AdjustedPosition;
                x = pos.x;
                y = pos.y;
                transform = `translate(${pos.dx + 5}, ${pos.dy + 10})`;
            }
            d3.select(this).attr("x", x)
                .attr("y", y)
                .attr('transform', transform)
                .text(lexset.displayName)
                .classed("lex-rhotic", lexset.rhotic!);
        });
    if(showLex) {
        newT.transition().duration(transition * 3/2)
            .style("opacity", "1"); // animated
    }
    
    // let update = everything.merge(newNodes as unknown as d3.Selection<d3.BaseType, LexicalSet, SVGGElement, unknown>);
    // update = d3.select("#svg-lex")
    //     .selectAll("g.lexset")
    //     .data([...lexsetData.values()]);
    
    
    // update circles
    update.select("circle.lex-circle")
        .attr("alt", lexset => lexset.displayName)
        .transition().duration(transition)
        .attr("r", lexset => showLex && !(lexset.position instanceof Diphthong) ? 20 : 0)
        // animated, as required when changing from diph to mono
        .filter(lexset => isAdjustedPosition(lexset.position))
        .attr("cx", lexset => (lexset.position as AdjustedPosition).x)
        .attr("cy", lexset => (lexset.position as AdjustedPosition).y);
    // .on("end", function(lexset) {
    //     if(lexset.position instanceof Diphthong) {
    //         d3.select(this).classed("hidden", true);
    //     }
    // });

    update.each(function (lexset) {
        d3.select(this).classed("lex-diph", lexset.position instanceof Diphthong);
    });
    
    // updating existing paths
    let paths = update.select("path.lex-path");
        // .attr('stroke', lexset => lexset.rhotic ? 'darkorchid' : '#3b3bb3');
    paths.attr("marker-end", function (lexset) {
        if(lexset.position instanceof Diphthong) {
            return lexset.rhotic ? "url(#diph-rho-arrowhead)" : "url(#diph-arrowhead)"
        }
        return null;
    });
    
    // update paths
    paths.each(function(lexset) { // path is exception to diphTogglable
            
        let isdiph = lexset.position instanceof Diphthong;
        let path = d3.select(this);
        let anim = path as 
            d3.Transition<d3.BaseType, unknown, null, undefined> | d3.Selection<d3.BaseType, unknown, null, undefined>;
        if (showLex) anim = path.transition().duration(transition * 5/2);
        anim.attr('stroke-opacity', isdiph ? 0.5 : 0); // animated
        if (isdiph) {
            let diph = lexset.position as Diphthong;
            anim.attr("d", d3.line()([[diph.start.x, diph.start.y], [diph.end.x, diph.end.y]]));
        } else if(isAdjustedPosition(lexset.position)) {
            let pos = lexset.position as AdjustedPosition;
            anim.attr("d", d3.line()([[pos.x, pos.y], [pos.x, pos.y]]));
            
        }
    });
    

    
    // update text
    let text = update.select("text.lex-text")
        // .classed("hidden", !show)
        .text(lexset => lexset.displayName)
        .classed("diph-tog", lexset => lexset.position instanceof Diphthong);
    
    text.each(function (lexset) {
        let x;
        let y;
        let transform;
        if (lexset.position instanceof Diphthong) {
            let [rotation, midpoint] = positionDiphText(lexset.position);
            // if (!showDiphs) d3.select(this).classed("diph-hidden", true);
            x = midpoint[0];
            y = midpoint[1];
            transform = `rotate(${rotation}, ${midpoint[0]}, ${midpoint[1]})`;
        } else {
            if(lexset.name === 'NEAR') {
                console.log('readjusting');
            }
            let pos = lexset.position as AdjustedPosition;
            x = pos.x;
            y = pos.y;
            transform = `translate(${pos.dx + 5}, ${pos.dy + 10})`;
            d3.select(this).classed("diph-hidden", false);
        }
        d3.select(this).transition().duration(transition * 3/2)
            .style("opacity", showLex && (isAdjustedPosition(lexset.position) || showDiphs) ? 1 : 0)
            .attr("x", x)
            .attr("y", y)
            .attr('transform', transform)
            .text(lexset.displayName)
            .on('end', function() {
                d3.select(this).classed("diph-hidden", lexset.position instanceof Diphthong && !showDiphs);
            });
    });
    
    // animate the bound
    update.select(".diph-bounds")
        .transition()
        .duration(transition * 5/2)
        .attr('d', function(lexset){
            let diph = lexset.position as Diphthong;
            let start = [diph.start.x, diph.start.y] as [number, number];
            let end = [diph.end.x, diph.end.y] as [number, number];
            return d3.line()([start, end]);
        });
                
    
    let joined = update.merge(newNodes);
    d3data = joined;
    return joined;
        
}

export function loadLexicalSets(svg: d3.Selection<SVGGElement, unknown, HTMLElement, any>, 
    vowelData: Vowels) {

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
        snapshots.RP!.data.forEach((v, lex) => {
            lex.RP = v as AdjustedVowel;
        });
        snapshots.GA!.data.forEach((v, lex) => {
            lex.GA = v as AdjustedVowel;
        });
        
        console.log('lexical sets:', lexsetData);

        updateLexsets(lexsetData, false, true);
        return;
        
        let nodes = svg.select("#svg-lex")
            .selectAll("foo")
            .data([...lexsetData.values()])
            .enter()
            .append("g");

        const curve = d3.line();
        
        // for(let lexset of lexsetData.values()) {
            // let node = gs.append("g")
            //     .classed(`lex-${lexset.name}`, true);
        nodes.each(function(lexset) {
            this.classList.add(`lex-${lexset.name}`);
            
            let ele = lexset.GA;
            if (ele instanceof Diphthong) {
                this.classList.add("lex-diph");
            } else if (ele instanceof AdjustedVowel) {
                // pass
            } else {
                console.log("neither diph nor pos", lexset.name);
                return;
            }
            lexset.position = ele;
        });
            
        // path, which for monophthongs is just a dot
        let paths = nodes.append("path")
            .classed("lex-path", true)
            .attr('stroke', lexset => lexset.rhotic ? 'darkorchid' : '#3b3bb3')
            .attr('stroke-dasharray', '10,10');
        
        // let diphs = nodes.filter(lexset => lexset.GA instanceof Diphthong);
        // let monos = nodes.filter(lexset => lexset.GA instanceof AdjustedVowel);
        // diphs.classed("lex-diph", true);
        // monos.classed("lex-monophthong", true);
        paths.attr("marker-end", function (lexset) {
            if(lexset.position instanceof Diphthong) {
                return lexset.rhotic ? "url(#diph-rho-arrowhead)" : "url(#diph-arrowhead)"
            }
            return null;
        });
        
        nodes.append("circle")
            .classed("lex-circle", true)
            .style("fill", "#69b3a222")
            .classed("hidden", lexset => lexset.position instanceof Diphthong)
            .attr("cx", lexset => (lexset.position as AdjustedPosition).x)
            .attr("cy", lexset => (lexset.position as AdjustedPosition).y)
            .attr("r", 0) // animated
            .attr("alt", lexset => lexset.displayName);
        
        paths.attr('stroke-opacity', lexset => 
            lexset.position instanceof Diphthong ? 0.5 : 0) // animated
        
        nodes.append("text")
            .classed("lex-text", true)
            .classed("hidden", true)
            .style("opacity", "0") // animated
            .text(lexset => lexset.displayName)
            .classed("lex-rhotic", lexset => lexset.rhotic!);
        
        // text
        let positionLexset = function(lexset: LexicalSet) {
            let node = d3.select(this);
            // console.log('processing ', lexset.name);
            let path = node.select("path");
            
            let ele = lexset.position;
            let diph = ele instanceof Diphthong ? ele : undefined;
            let pos = diph ? undefined : ele as AdjustedVowel;

            if (!(diph || pos)) {
                console.log("neither diph nor pos", lexset.name);
                return;
            }

            // visible
            let start;
            let end;
            if (diph) {
                start = [diph.start.x, diph.start.y] as [number, number];
                end = [diph.end.x, diph.end.y] as [number, number];
            } else if (pos) {
                start = end = [pos.x, pos.y] as [number, number];
            } else {
                return;
            }
            path.attr('stroke-opacity', diph ? 0.5 : 0) // animated
                .attr("d", curve([start, end]));

            // text
            let text = node.select("text.lex-text");
            if (diph) {
                let [rotation, midpoint] = positionDiphText(diph);
                text.classed("lex-diph-text", true)
                    .attr("x", midpoint[0])
                    .attr("y", midpoint[1])
                    .attr("transform",
                        `rotate(${rotation}, ${midpoint[0]}, ${midpoint[1]})`);
            } else if (pos) {
                text.attr("x", pos.x)
                    .attr("y", pos.y)
                    .attr('transform',
                        `translate(${pos.dx + 5}, ${pos.dy + 10})`);
            }
            // the circle and text have the same x/y, but the text just has an offset

            // clickable diphthongs
            if (diph) {
                let player = new DiphthongScheduler(diph.start, diph.end);
                // diphGroup
                node.append("path")
                    .attr("d", curve([start, end]))
                    .classed("diph-bounds", true)
                    // hidden - animated
                    .attr('stroke', 'white') // this just needs to be here
                    .attr('stroke-opacity', 0)
                    .attr('stroke-width', 10)
                    .style("cursor", "pointer")
                    .on("click", function () {
                        player.play();
                    });

                // bounds
                if (!diph.end) return;
                //     .attr('stroke', '#69b3a222')
                //     .attr('stroke-linecap', 'round')
            }
        } as d3.ValueFn<SVGGElement, LexicalSet, void>;
        // the circle and text have the same x/y, but the text just has an offset
        
        nodes.each(positionLexset);
        
        // diphthongs
    });
}
