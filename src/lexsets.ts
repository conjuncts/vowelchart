import * as d3 from 'd3';
import { Diphthong, isRhotic, AdjustedVowel, Vowels, AdjustedPosition, isAdjustedPosition } from './vowels';
import { DiphthongScheduler } from './synthesis';
import { positionDiphText } from './positioning';
import { loadSnapshot } from './snapshot';

export class LexicalSet {
    name: string;
    RP?: (AdjustedVowel | Diphthong);
    GA?: (AdjustedVowel | Diphthong);
    position: (AdjustedPosition | Diphthong | undefined);
    examples: string[];
    constructor() {
        this.name = "";
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

// let lexsetPositions: Map<string, PositionedVowel> = new Map();
export function updateLexsets(lexsetData: Lexsets, show: boolean) {
    let update = d3.select("#svg-lex")
        .selectAll("g")
        .data([...lexsetData.values()]);
    
    let paths = update.select("path.lex-path");
    paths.attr("marker-end", function (lexset) {
        if(lexset.position instanceof Diphthong) {
            return lexset.rhotic ? "url(#diph-rho-arrowhead)" : "url(#diph-arrowhead)"
        }
        return null;
    });
    
    update.select("circle.lex-circle")
        .attr("alt", lexset => lexset.name)
        .transition().duration(200)
        .attr("r", lexset => lexset.position instanceof Diphthong ? 0 : 20) 
        // animated, as required when changing from diph to mono
        .filter(lexset => isAdjustedPosition(lexset.position))
        .attr("cx", lexset => (lexset.position as AdjustedPosition).x)
        .attr("cy", lexset => (lexset.position as AdjustedPosition).y)
        .on("end", function(lexset) {
            if(lexset.position instanceof Diphthong) {
                d3.select(this).classed("hidden", true);
            }
        });
    
    update.each(function(lexset) {
        d3.select(this).classed("lex-diph", lexset.position instanceof Diphthong);        
    });
        
    paths.each(function(lexset) {
            
        let isdiph = lexset.position instanceof Diphthong;
        let path = d3.select(this).transition().duration(500);
        path.attr('stroke-opacity', isdiph ? 0.5 : 0); // animated
        if (isdiph) {
            let diph = lexset.position as Diphthong;
            let start = [diph.start.x, diph.start.y] as [number, number];
            let end = [diph.end.x, diph.end.y] as [number, number];
            path.attr("d", d3.line()([start, end]));
        
        } else if(isAdjustedPosition(lexset.position)) {
            let pos = lexset.position as AdjustedPosition;
            path.attr("d", d3.line()([[pos.x, pos.y], [pos.x, pos.y]]));
        }
    });
        
    let text = update.select("text.lex-text")
        // .classed("hidden", !show)
        .transition().duration(300)
        // .style("opacity", show ? "1" : "0"); // animated
        
    text.filter(lexset => isAdjustedPosition(lexset.position))
        .attr("x", lexset => (lexset.position as AdjustedPosition).x)
        .attr("y", lexset => (lexset.position as AdjustedPosition).y)
        .attr('transform', lexset => {
            let pos = lexset.position as AdjustedPosition;
            return `translate(${pos.dx + 5}, ${pos.dy + 10})`;
        });
    
    text.filter(lexset => lexset.position instanceof Diphthong)
        .each(function(lexset) {
            let diph = lexset.position as Diphthong;
            let [rotation, midpoint] = positionDiphText(diph);
            d3.select(this)
                .classed("lex-diph-text", true)
                .transition().duration(300)
                .attr("x", midpoint[0])
                .attr("y", midpoint[1])
                .attr("transform",
                    `rotate(${rotation}, ${midpoint[0]}, ${midpoint[1]})`);
        });
    
    // animate the bound
    update.select(".diph-bounds")
        .transition()
        .duration(500)
        .attr('d', function(lexset){
            let diph = lexset.position as Diphthong;
            let start = [diph.start.x, diph.start.y] as [number, number];
            let end = [diph.end.x, diph.end.y] as [number, number];
            return d3.line()([start, end]);
        });
                
                
        
}

export function loadLexicalSets(svg: d3.Selection<SVGGElement, unknown, HTMLElement, any>, 
    vowelData: Vowels) {

    // load lexical sets
    d3.tsv("lexsets.tsv").then((data) => {
        data.forEach((d: any, idx: number) => {
            let lex = new LexicalSet();
            lex.name = d["Name"];
            lex.examples = d['Examples'].split(', ');
            lex.checked = idx < 8; // KIT through CLOTH
            lex.free = 8 <= idx && idx < 13; // NURSE through THOUGHT
            lex.diphthong = 13 <= idx && idx < 18; // GOAT through MOUTH
            lex.weak = 18 <= idx && idx < 21; // PRICE through CHOICE
            lex.rhotic = 21 <= idx || lex.name === 'NURSE'; // NEAR through CURE and NURSE

            lexsetData.set(lex.name, lex);
        });
        
        let snapshots = loadSnapshot(data, vowelData, lexsetData, ['RP', 'GA']);
        snapshots[0]!.data.forEach((v, lex) => {
            lex.RP = v as AdjustedVowel;
        });
        snapshots[1]!.data.forEach((v, lex) => {
            lex.GA = v as AdjustedVowel;
        });
        console.log('lexical sets:', lexsetData);

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
            .attr("alt", lexset => lexset.name);
        
        paths.attr('stroke-opacity', lexset => 
            lexset.position instanceof Diphthong ? 0.5 : 0) // animated
        
        nodes.append("text")
            .classed("lex-text", true)
            .classed("hidden", true)
            .style("opacity", "0") // animated
            .text(lexset => lexset.name)
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
