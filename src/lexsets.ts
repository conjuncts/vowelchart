import * as d3 from 'd3';
import { Diphthong, isRhotic, AdjustedVowel, Vowels, AdjustedPosition } from './vowels';
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

export function loadLexicalSets(svg: d3.Selection<SVGGElement, unknown, HTMLElement, any>, 
    vowelData: Vowels) {

    // load lexical sets
    d3.tsv("lexsets.tsv").then((data) => {
        // let _RPbuilder: AdjustedPosition[] = [];
        // let _GAbuilder: AdjustedPosition[] = [];
        data.forEach((d: any, idx: number) => {
            let lex = new LexicalSet();
            lex.name = d["Name"];
            // let RP: (Vowel | Diphthong) = vowelFromString(d["RP"], vowelData)!; 
            // // most of these will only have 1 element
            // let GA: (Vowel | Diphthong) = vowelFromString(d["GA"], vowelData)!;
            
            // // position
            // if(RP instanceof Diphthong) {
            //     lex.RP = RP;
            // } else {
            //     lex.RP = adjustVowel(RP, _RPbuilder); // , ...RPs.slice(1)];
            //     _RPbuilder.push(lex.RP);
            // }
            
            // if(GA instanceof Diphthong) {
            //     lex.GA = GA;
            // } else {
            //     let GA_positioned = adjustVowel(GA, _GAbuilder);
            //     lex.GA = GA_positioned; // , ...GAs.slice(1)];
            //     _GAbuilder.push(GA_positioned);
            // }
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

        // place behind, https://stackoverflow.com/a/36792669
        let nodes = svg.insert('g', "#svg-vowels")
            .attr("id", "svg-lex")
            .selectAll("foo")
            .data([...lexsetData.values()])
            .enter()
            .append("g");

        const curve = d3.line();
        

        
        // for(let lexset of lexsetData.values()) {
            // let node = gs.append("g")
            //     .classed(`lex-${lexset.name}`, true);
        nodes.each(function(lexset, idx) {
            this.classList.add(`lex-${lexset.name}`);
        });
            
        // path, which for monophthongs is just a dot
        let paths = nodes.append("path")
            .classed("lex-path", true)
            .attr('stroke', lexset => lexset.rhotic ? 'darkorchid' : '#3b3bb3')
            .attr('stroke-dasharray', '10,10');
        
        // let diphs = nodes.filter(lexset => lexset.GA instanceof Diphthong);
        let monos = nodes.filter(lexset => lexset.GA instanceof AdjustedVowel);
        // diphs.classed("lex-diph", true);
        // monos.classed("lex-monophthong", true);
        
        nodes.each(function(lexset, idx) {
            let ele = lexset.GA;
            if(ele instanceof Diphthong) {
                this.classList.add("lex-diph");
            } else if (ele instanceof AdjustedVowel) {
                // pass
            } else {
                console.log("neither diph nor pos", lexset.name);
                return;
            }
            lexset.position = ele;
        });
        
        paths.attr("marker-end", function (lexset) {
            if(lexset.position instanceof Diphthong) {
                return lexset.rhotic ? "url(#diph-rho-arrowhead)" : "url(#diph-arrowhead)"
            }
            return null;
        });
        
        monos.append("circle")
            .classed("lex-circle", true)
            .attr("cx", lexset => (lexset.position as AdjustedPosition).x)
            .attr("cy", lexset => (lexset.position as AdjustedPosition).y)
            .attr("r", 0) // animated
            .style("fill", "#69b3a222")
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
        let positionLexset = function(lexset: LexicalSet, idx: number) {
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
                // path.attr("marker-end", lexset.rhotic ?
                //     "url(#diph-rho-arrowhead)" : "url(#diph-arrowhead)");
                // node.classed("lex-diph", true);
                // lexset.position = diph;
            } else if (pos) {
                start = end = [pos.x, pos.y] as [number, number];
                // plot circles for monophthongs
                // node.append("circle")
                //     .classed("lex-circle", true)
                //     .attr("cx", pos.x)
                //     .attr("cy", pos.y)
                //     .attr("r", 0) // animated
                //     .style("fill", "#69b3a222")
                //     .attr("alt", lexset.name);
                // lexset.position = pos;
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
                path.attr("d", curve([start, start]));
                text.attr("x", pos.x)
                    .attr("y", pos.y)
                    .attr('transform',
                        `translate(${pos.dx + 5}, ${pos.dy + 10})`);
                    // .classed("hidden", true)
                    // .style("opacity", "0") // animated
                    // .text(lexset.name)
                    // .classed("lex-rhotic", lexset.rhotic!);
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
