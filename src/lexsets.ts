import * as d3 from 'd3';
import { Diphthong, LexicalSet, Vowel, vowelFromString } from './vowels';


export let diphs = `e ɪ
a ɪ
ɔ ɪ
a ʊ
o ʊ̞`.split("\n").map((x) => x.split(' '));

// ʊ

export let lexsetData: Map<string, LexicalSet> = new Map();


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
        data.forEach((d: any, idx: number) => {
            let lex = new LexicalSet();
            lex.name = d["Name"];
            lex.RP = d["RP"].split(", ").map((s: string) => vowelFromString(s, formantData)); 
            // most of these will only have 1 element
            lex.GA = d["GA"].split(", ").map((s: string) => vowelFromString(s, formantData));
            lex.examples = d['Examples'].split(', ');

            lex.checked = idx < 8; // KIT through CLOTH
            lex.free = 8 <= idx && idx < 13; // NURSE through THOUGHT
            lex.diphthong = 13 <= idx && idx < 18; // GOAT through MOUTH
            lex.weak = 18 <= idx && idx < 21; // PRICE through CHOICE
            lex.rhotic = 21 <= idx || lex.name === 'NURSE'; // NEAR through CURE and NURSE

            lexsetData.set(lex.name, lex);
        });

        // move rhotics to the end
        // let rhotics = [];
        // for(let lexset of lexsetData.values()) {
        //     if(lexset.isRhotic()) {
        //         rhotics.push(lexset);
        //     }
        // }
        // for(let rhotic of rhotics) {
        //     lexsetData.delete(rhotic.name);
        //     lexsetData.set(rhotic.name, rhotic);
        // }


        // console.log(data);
        console.log('lexical sets: ', lexsetData);

        let vowels = data.filter(d => !(lexsetData.get(d.Name)?.GA[0] instanceof Diphthong));

        lexsetData.forEach((d: LexicalSet) => {
            if(d.GA[0] !== undefined) {
                position(d.name, (d.GA[0] as Vowel).F1, (d.GA[0] as Vowel).F2, x, y);
            }
        });
        // console.log('lexical set positions: ', lexsetPositions);

        // place behind, https://stackoverflow.com/a/36792669
        let gs = svg.insert('g', ":first-child")
            .selectAll("text")
            .data(vowels)
            .enter()
            .append("g");

        
        let dx = function(name: string) {
            return lexsetPositions.get(name)!.adjustedx + 5 - lexsetPositions.get(name)!.x;
        };
        let dy = function(name: string) {
            return lexsetPositions.get(name)!.adjustedy + 10 - lexsetPositions.get(name)!.y;
        };
        gs.append("text")
            .classed("lex-text", true)
            .attr("x", d => lexsetPositions.get(d.Name)!.x)
            .attr("y", d => lexsetPositions.get(d.Name)!.y)

            // .attr("x", d => lexsetPositions.get(d.Name)!.adjustedx + 5)
            // .attr("y", d => lexsetPositions.get(d.Name)!.adjustedy + 10)
            // .style("fill", d => lexsetData.get(d.Name)?.isRhotic() ? "blue" : "black") // blue // 4B8073

            .attr('transform', 
                d => `translate(${dx(d.Name)}, ${dy(d.Name)})`) 
            .style("opacity", "0") // animated
            .text(d => { return d.Name })
            .classed("lex-rhotic", d => lexsetData.get(d.Name)!.rhotic!);
        // the circle and text have the same x/y, but the text just has an offset

        // plot circles
        gs.append("circle")
            .classed("lex-circle", true)
            .attr("cx", d => lexsetPositions.get(d.Name)!.x)
            .attr("cy", d => lexsetPositions.get(d.Name)!.y)
            .attr("r", 0) // animated

            .style("fill", "#69b3a222")
            .attr("alt", d => d.Name)
            .classed("lex-rhotic", d => lexsetData.get(d.Name)!.isRhotic());


        // diphthongs
        const curve = d3.line();

        let diphs = svg.insert('g', ":first-child");
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
            // console.log(rotation);
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
