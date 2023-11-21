import * as d3 from 'd3';



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
            let process = {} as LexicalSet;
            process.Name = d["Name"];
            process.RP = d["RP"].split(", ").map((e: string) => {
                return e.length === 1 ? formantData[e] : undefined; // TODO: diphthongs
            }); // most of these will only have 1 element
            process.GA = d["GA"].split(", ").map((e: string) => {
                return e.length === 1 ? formantData[e] : undefined;
            });
            process.Examples = d['Examples'].split(', ');
            lexsetData.set(process.Name, process);
        });

        console.log(data);
        console.log(lexsetData);

        let monopthongs = data.filter(d => lexsetData.get(d.Name)!.GA[0] !== undefined);

        lexsetData.forEach((d: LexicalSet) => {
            if(d.GA[0] !== undefined) {
                position(d.Name, d.GA[0].F1, d.GA[0].F2, x, y);
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