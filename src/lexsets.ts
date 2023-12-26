import * as d3 from 'd3';
import { Diphthong, Vowel, isRhotic, vowelFromString, positionVowel, PositionedVowel, isPositionedVowel, isVowel } from './vowels';

export class LexicalSet {
    name: string;
    RP: (Vowel | PositionedVowel | Diphthong)[];
    GA: (Vowel | PositionedVowel | Diphthong)[];
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
    formantData: Record<string, Vowel>,
    x: d3.ScaleLinear<number, number, never>,
    y: d3.ScaleLinear<number, number, never>) {

    // load lexical sets
    d3.tsv("lexsets.tsv").then((data) => {
        let _RP_builder: PositionedVowel[] = [];
        let _GA_builder: PositionedVowel[] = [];
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
                let RP_positioned = positionVowel(lex.name, RPs[0], x, y, _RP_builder);
                lex.RP = [RP_positioned, ...RPs.slice(1)];
                _RP_builder.push(RP_positioned);
            }
            
            if(GAs[0] instanceof Diphthong) {
                lex.GA = GAs;
            } else {
                let GA_positioned = positionVowel(lex.name, GAs[0], x, y, _GA_builder);
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
        let gs = svg.insert('g', ":first-child")
            .attr("id", "svg-lex");
            // .selectAll("text")
            // .data(vowels)
            // .enter()
            // .append("g");

        for(let lexset of lexsetData.values()) {
            if(!isVowel(lexset.GA[0]) || !isPositionedVowel(lexset.GA[0])) {
                continue;
            }
            let pos = lexset.GA[0] as Vowel & PositionedVowel;
            let node = gs.append("g")
                .classed(`lex-${lexset.name}`, true);
            node.append("text")
                .classed("lex-text", true)
                .attr("x", pos.x)
                .attr("y", pos.y)
                .attr('transform', 
                    `translate(${pos.dx + 5}, ${pos.dy + 10})`) 
                .style("opacity", "0") // animated
                .text(lexset.name)
                .classed("lex-rhotic", lexset.rhotic!);
            // the circle and text have the same x/y, but the text just has an offset

            // plot circles
            node.append("circle")
                .classed("lex-circle", true)
                .attr("cx", pos.x)
                .attr("cy", pos.y)
                .attr("r", 0) // animated

                .style("fill", "#69b3a222")
                .attr("alt", lexset.name);
                // .classed("lex-rhotic", lexset.rhotic!);
        }

        // diphthongs
        const curve = d3.line();

        let diphs = svg.insert('g', ":first-child").attr("id", "svg-lex-diphs");
        for(let lexset of lexsetData.values()) {
            if(!(lexset.GA[0] instanceof Diphthong)) {
                continue;
            }
            let diph = lexset.GA[0] as Diphthong;
            // console.log("diph: ", diph);

            // bounds
            if(!diph.end) continue;
            diphs.append("path")
                .attr("d", curve([[x(diph.start.F2), y(diph.start.F1)], [x(diph.end.F2), y(diph.end.F1)]]))
                .classed("lex-diph-paths", true)
                .attr('stroke-width', 0) // animated
                .attr('stroke', '#69b3a222')
                .attr('stroke-linecap', 'round')
                .attr('fill', 'none')
                .style("pointer-events", "none")
            let dy = y(diph.end.F1) - y(diph.start.F1);
            let dx = x(diph.end.F2) - x(diph.start.F2);
            let midpoint = [x(diph.start.F2) +dx/3, y(diph.start.F1) + dy/ 3];
            // 1/3 point has fewer collision
            let rotation = Math.atan2(dy, 
                dx) * 180 / Math.PI;

            if(-270 <= rotation && rotation <= -90) {
                rotation += 180;
            }
            // text
            diphs.append("text")
                .classed("lex-diph-text", true)
                .attr("transform", 
                    `translate(${midpoint[0] - 5}, ${midpoint[1] - 5}) rotate(${rotation})`)
                .style("opacity", "0") // animated
                .text(lexset.name);
        }
    });
}

export function toggleRP(enable?: boolean) {
    if (enable === undefined) {
        enable = (document.getElementById('toggle-rp') as HTMLInputElement).checked;
    }
    function* yieldValues() {
        for (let lexset of lexsetData.values()) {
            let pos = enable ? lexset.RP[0] : lexset.GA[0];
            if (!isVowel(pos) || !isPositionedVowel(pos)) {
                continue;
            }
            yield [lexset, pos] as [LexicalSet, Vowel & PositionedVowel];
        }
    }
    for (let [lexset, pos] of yieldValues()) {
        let node = d3.select(`.lex-${lexset.name}`);
        
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