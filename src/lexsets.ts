import * as d3 from 'd3';
import { Diphthong, Vowel, isRhotic, vowelFromString, positionVowel, AdjustedPosition, PositionedVowel } from './vowels';
import { DiphthongScheduler } from './synthesis';
import { positionDiphText } from './positioning';

export class LexicalSet {
    name: string;
    RP: (Vowel | AdjustedPosition | Diphthong)[];
    GA: (Vowel | AdjustedPosition | Diphthong)[];
    position: (PositionedVowel | Diphthong | undefined);
    examples: string[];
    constructor() {
        this.name = "";
        this.RP = [];
        this.GA = [];
        this.examples = [];
    }
    isRhotic(): boolean {
        return isRhotic(this.GA[0]);
    }
    checked?: boolean;
    free?: boolean;
    diphthong?: boolean;
    weak?: boolean;
    rhotic?: boolean;
}

export let lexsetData: Map<string, LexicalSet> = new Map();

// let lexsetPositions: Map<string, PositionedVowel> = new Map();

export function loadLexicalSets(svg: d3.Selection<SVGGElement, unknown, HTMLElement, any>, 
    formantData: Record<string, PositionedVowel>,
    x: d3.ScaleLinear<number, number, never>,
    y: d3.ScaleLinear<number, number, never>) {

    // load lexical sets
    d3.tsv("lexsets.tsv").then((data) => {
        let _RP_builder: AdjustedPosition[] = [];
        let _GA_builder: AdjustedPosition[] = [];
        data.forEach((d: any, idx: number) => {
            let lex = new LexicalSet();
            lex.name = d["Name"];
            let RPs: (Vowel | Diphthong)[] = d["RP"].split(", ").map((s: string) => vowelFromString(s, formantData)); 
            // most of these will only have 1 element
            let GAs: (Vowel | Diphthong)[] = d["GA"].split(", ").map((s: string) => vowelFromString(s, formantData));
            
            // position
            if(RPs[0] instanceof Diphthong) {
                lex.RP = RPs;
            } else {
                let RP_positioned = positionVowel(RPs[0], x, y, _RP_builder);
                lex.RP = [RP_positioned, ...RPs.slice(1)];
                _RP_builder.push(RP_positioned);
            }
            
            if(GAs[0] instanceof Diphthong) {
                lex.GA = GAs;
            } else {
                let GA_positioned = positionVowel(GAs[0], x, y, _GA_builder);
                lex.GA = [GA_positioned, ...GAs.slice(1)];
                _GA_builder.push(GA_positioned);
            }
            lex.examples = d['Examples'].split(', ');

            lex.checked = idx < 8; // KIT through CLOTH
            lex.free = 8 <= idx && idx < 13; // NURSE through THOUGHT
            lex.diphthong = 13 <= idx && idx < 18; // GOAT through MOUTH
            lex.weak = 18 <= idx && idx < 21; // PRICE through CHOICE
            lex.rhotic = 21 <= idx || lex.name === 'NURSE'; // NEAR through CURE and NURSE

            lexsetData.set(lex.name, lex);
        });

        console.log('lexical sets: ', lexsetData);

        // place behind, https://stackoverflow.com/a/36792669
        let gs = svg.insert('g', "#svg-vowels")
            .attr("id", "svg-lex");

        const curve = d3.line();
        
        for(let lexset of lexsetData.values()) {
            let node = gs.append("g")
                .classed(`lex-${lexset.name}`, true);
            
            // path, which for monophthongs is just a dot
            let path = node.append("path")
                .classed("lex-path", true)
                .attr('stroke', lexset.rhotic ? 'darkorchid' : '#3b3bb3')
                .attr('stroke-dasharray', '10,10');
            let ele = lexset.GA[0];
            let diph = ele instanceof Diphthong ? ele : undefined;
            let pos = diph ? undefined : ele as Vowel & AdjustedPosition;
            
            if(!(diph || pos)) {
                console.log("neither diph nor pos", lexset.name);
                continue;
            }
            
            // visible
            let start;
            let end;
            if(diph) {
                start = [diph.start.x, diph.start.y] as [number, number];
                end = [diph.end.x, diph.end.y] as [number, number];
                path.attr("marker-end", lexset.rhotic ?
                    "url(#diph-rho-arrowhead)" : "url(#diph-arrowhead)");
                node.classed("lex-diph", true);
                lexset.position = diph;
            } else if(pos) {
                start = end = [pos.x, pos.y] as [number, number];
                // plot circles for monophthongs
                node.append("circle")
                    .classed("lex-circle", true)
                    .attr("cx", pos.x)
                    .attr("cy", pos.y)
                    .attr("r", 0) // animated
                    .style("fill", "#69b3a222")
                    .attr("alt", lexset.name);
                lexset.position = pos;
            } else {
                continue;
            }
            path.attr('stroke-opacity', diph ? 0.5 : 0) // animated
                .attr("d", curve([start, end]));
            
            // text
            if(diph) {
                let [rotation, midpoint] = positionDiphText(diph);
                node.append("text")
                    .classed("lex-text", true)
                    .classed("lex-diph-text", true)
                    .attr("x", midpoint[0])
                    .attr("y", midpoint[1])
                    .attr("transform",
                        `rotate(${rotation}, ${midpoint[0]}, ${midpoint[1]})`)
                    .classed("hidden", true)
                    .style("opacity", "0") // animated
                    .text(lexset.name);
            } else if (pos) {
                path.attr("d", curve([start, start]));
                node.append("text")
                    .classed("lex-text", true)
                    .attr("x", pos.x)
                    .attr("y", pos.y)
                    .attr('transform',
                        `translate(${pos.dx + 5}, ${pos.dy + 10})`)
                    .classed("hidden", true)
                    .style("opacity", "0") // animated
                    .text(lexset.name)
                    .classed("lex-rhotic", lexset.rhotic!);
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
                if (!diph.end) continue;
                //     .attr('stroke', '#69b3a222')
                //     .attr('stroke-linecap', 'round')
            }
        }

        // diphthongs
    });
}
