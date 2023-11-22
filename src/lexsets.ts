import * as d3 from 'd3';
import { Diphthong, LexicalSet, Vowel } from './vowels';


export let diphs = `e ɪ
a ɪ
ɔ ɪ
a ʊ
o ʊ̞`.split("\n").map((x) => x.split(' '));

// ʊ

export let lexsetData: Map<string, LexicalSet> = new Map();

let lexicalCircles: d3.Selection<SVGCircleElement, d3.DSVRowString<string>, SVGGElement, unknown >;
let lexicalText: d3.Selection<SVGTextElement, d3.DSVRowString<string>, SVGGElement, unknown >;


class AdjustedPosition {
    x: number;
    y: number;
    adjustedx: number;
    adjustedy: number;
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.adjustedx = x;
        this.adjustedy = y;
    }

}

let lexsetPositions: Map<string, AdjustedPosition> = new Map();
function position(name: string, F1: number, F2: number, 
    x: d3.ScaleLinear<number, number, never>,
    y: d3.ScaleLinear<number, number, never>) {
    let atx = x(F2);
    let aty = y(F1);
    let textx = atx;
    let texty = aty;
    // prevent at same position
    for(let pos of lexsetPositions.values()) {
        if(Math.abs(pos.adjustedx - textx) < 10 && Math.abs(pos.adjustedy - texty) < 10) {
            texty += 10; // works since duplicates are handled ascending
        }
    }
    // console.log("set!");

    let position = new AdjustedPosition(atx, aty);
    position.adjustedx = textx;
    position.adjustedy = texty;
    lexsetPositions.set(name, position);
}
export function loadLexicalSets(svg: d3.Selection<SVGGElement, unknown, HTMLElement, any>, 
    formantData: Record<string, Vowel>,
    x: d3.ScaleLinear<number, number, never>,
    y: d3.ScaleLinear<number, number, never>) {

    // load lexical sets
    d3.tsv("lexsets.tsv").then((data) => {
        console.log("lexsets loaded!");
        data.forEach((d: any) => {
            let process = new LexicalSet();
            process.name = d["Name"];
            process.RP = d["RP"].split(", ").map((e2: string) => {
                let e = e2.replace('ː', '');
                if(e.length === 1) {
                    return formantData[e]; // monophthong
                } else {
                    return new Diphthong(formantData[e[0]], formantData[e[1]], e2);
                }
            }); // most of these will only have 1 element
            process.GA = d["GA"].split(", ").map((e2: string) => {
                let e = e2.replace('ː', '');
                if (e.length === 1) {
                    return formantData[e]; // monophthong
                } else {
                    return new Diphthong(formantData[e[0]], formantData[e[1]], e);
                }
            });
            process.examples = d['Examples'].split(', ');
            lexsetData.set(process.name, process);
        });

        console.log(data);
        console.log(lexsetData);

        let monopthongs = data.filter(d => !(lexsetData.get(d.Name)?.GA[0] instanceof Diphthong));

        lexsetData.forEach((d: LexicalSet) => {
            if(d.GA[0] !== undefined) {
                position(d.name, (d.GA[0] as Vowel).F1, (d.GA[0] as Vowel).F2, x, y);
            }
        });
        console.log(lexsetPositions);

        // place behind, https://stackoverflow.com/a/36792669
        let gs = svg.insert('g', ":first-child")
            .selectAll("text")
            .data(monopthongs)
            .enter()
            .append("g");

        lexicalText = gs.append("text")
            .classed("lexset", true)
            .attr("x", d => lexsetPositions.get(d.Name)!.adjustedx + 5) // Adjust the position as needed
            .attr("y", d => lexsetPositions.get(d.Name)!.adjustedy + 10)
            .style("user-select", "none")
            .style("pointer-events", "none")
            .style("fill", "blue")
            .style("opacity", "0")
            .text(d => { return d.Name }); // Text content

        // .data(data)
        // .enter()

        // plot circles
        lexicalCircles = gs.append("circle")
            .classed("lexset", true)
            .attr("cx", d => lexsetPositions.get(d.Name)!.x)
            .attr("cy", d => lexsetPositions.get(d.Name)!.y)
            .attr("r", 0)
            .style("z-index", "-9999")
            // .style("pointer-events", "none")
            .style("fill", "#69b3a222")
            .attr("alt", d => d.Name);


        const curve = d3.line();
        for(let lexset of lexsetData.values()) {
            if(!(lexset.GA[0] instanceof Diphthong)) {
                continue;
            }
            let diph = lexset.GA[0] as Diphthong;
            
            console.log("diph: ", diph);

            // some r's are here
            if(!diph.end) continue;
            gs.append("path")
                .attr("d", curve([[x(diph.start.F2), y(diph.start.F1)], [x(diph.end.F2), y(diph.end.F1)]]))
                .classed("lex-diph-paths", true)
                .attr('stroke-opacity', 0.5)
                .attr('stroke-width', 0)
                .attr('stroke', '#69b3a20a')
                .attr('stroke-linecap', 'round')
                .attr('fill', 'none')
                .style("pointer-events", "none")
        }
    });
}

export function onLexsetToggle(activate: boolean) {
    if(lexicalCircles) {
        if(activate) {
            lexicalCircles.transition()
                .duration(200)
                .attr("r", 20);
            lexicalText.transition()
                .duration(200)
                .style("opacity", "1");
        } else {
            lexicalCircles.transition()
                .duration(200)
                .attr("r", 0);
            lexicalText.transition()
                .duration(200)
                .style("opacity", "0");
        }
    }
}