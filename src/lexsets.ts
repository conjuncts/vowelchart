import * as d3 from 'd3';



export let diphs = `e ɪ
a ɪ
ɔ ɪ
a ʊ
o ʊ̞`.split("\n").map((x) => x.split(' '));

// ʊ

export let lexsetData: Record<string, LexicalSet> = {};

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
            lexsetData[process.Name] = process;
        });
        console.log(data);
        console.log(lexsetData);

        let monopthongs = data.filter(d => lexsetData[d.Name].GA[0] !== undefined);
        // place behind, https://stackoverflow.com/a/36792669
        let gs = svg.insert('g', ":first-child")
            .selectAll("text")
            .data(monopthongs)
            .enter()
            .append("g");

        gs.append("text")
            .classed("lexset", true)
            .attr("x", d => x(lexsetData[d.Name].GA[0]?.F2) + 5) // Adjust the position as needed
            .attr("y", d => y(lexsetData[d.Name].GA[0]?.F1) + 10)
            .style("user-select", "none")
            .style("pointer-events", "none")
            .style("fill", "blue")
            .text(d => { return d.Name }); // Text content

        // .data(data)
        // .enter()

        // plot circles
        gs.append("circle")
            .classed("lexset", true)
            .attr("cx", function (d) { return x(lexsetData[d.Name].GA[0]?.F2); })
            .attr("cy", function (d) { return y(lexsetData[d.Name].GA[0]?.F1); })
            .attr("r", 20)
            .style("z-index", "-9999")
            // .style("pointer-events", "none")
            .style("fill", "#69b3a211")
            .attr("alt", d => d.Name);

    });
}