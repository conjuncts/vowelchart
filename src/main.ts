

import * as d3 from 'd3';
import { changeVowel, startVowel, stopVowel } from './synthesis';
import { toggle, hydrateTabs } from './tabs';
import { loadLexicalSets } from './lexsets';
import { Vowels, Vowel, makeVowel } from './vowels';
(window as any).toggle = toggle;

hydrateTabs();

export let enableReferenceVowels = true;

// set the dimensions and margins of the graph
const margin = { top: 10, right: 30, bottom: 30, left: 60 },
    width = 690 - margin.left - margin.right, // 460
    height = 600 - margin.top - margin.bottom; // 400

// append the svg object to the body of the page
const svg = d3.select("#vowelchart svg g") as d3.Selection<SVGGElement, unknown, HTMLElement, any>;
    // .attr("width", width + margin.left + margin.right)
    // .attr("height", height + margin.top + margin.bottom)
    // .append("g")
    // .attr("transform", `translate(${margin.left}, ${margin.top})`);

let topOffset = 20;
let rightOffset = 40;
// Axes
let axes = svg.select("#axes");
export const x = d3.scaleLinear()
    .domain([2500, 500])
    .range([0, width - rightOffset]);
axes.append("g")
    .attr("transform", `translate(0, ${topOffset})`)
    .style("user-select", "none")
    .call(d3.axisTop(x));
export const y = d3.scaleLinear()
    .domain([860, 175])
    .range([height, topOffset]);
axes.append("g")
    .attr("transform", `translate(${width - rightOffset}, 0)`)
    .style("user-select", "none")
    .call(d3.axisRight(y));

// vowel synthesis playback
svg.select("#vowel-playback")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", width - rightOffset)
    .attr("height", height)
    .style("fill", "transparent")
    .style("z-index", "1")
    .on("mousedown", function (e) {
        let f1 = y.invert(d3.pointer(e)[1]);
        let f2 = x.invert(d3.pointer(e)[0]);
        // console.log(f1, f2);
        startVowel({ F1: f1, F2: f2 });
    })
    .on("mousemove", function (e) {
        let f1 = y.invert(d3.pointer(e)[1]);
        let f2 = x.invert(d3.pointer(e)[0]);
        // console.log(f1, f2);
        if (e.buttons === 1) {
            changeVowel({ F1: f1, F2: f2 });
        }
    });


// Read the data
export let vowelData: Vowels = {};

export let d3gs: d3.Selection<SVGGElement, Vowel, SVGGElement, unknown>;

d3.tsv("formants.tsv").then(function (data) {
    // put data
    data.forEach((d: any) => {
        let [F1, F2, F3] = [+d.F1, +d.F2, +d.F3];
        let v = makeVowel(d.filename, d.symbol, F1, F2, F3, x(F2), y(F1));
        vowelData[v.symbol] = v;
    });
    console.log('vowel formants:', vowelData);

    // add dotted line edges between these vowels: i, e, ɛ, æ, a, ɑ, ɒ, ɔ, o, u to signify frontier
    let frontier = ["i", "e", "ɛ", "æ", "a", "ä", "ɑ", "ɒ", "ɔ", "o", "u"];
    let vertices = frontier.map(d => [vowelData[d].x, vowelData[d].y]);

    const curve = d3.line().curve(d3.curveMonotoneX);

    // dotted lines
    svg.select('#frontier')
        .attr('d', curve(vertices as any))
        .attr('stroke', 'black')
        .attr('fill', 'none')
        .attr('stroke-dasharray', '5,5')
        .style("pointer-events", "none")
        // .style("user-select", "none")
        .style("z-index", "-99");

    // begin data points
    let gs = d3gs = svg.select('#svg-vowels')
        .selectAll("foo")
        .data(Object.values(vowelData).filter(d => d.show))
        .enter()
        .append("g") as d3.Selection<SVGGElement, Vowel, SVGGElement, unknown>;

    gs.append("text")
        .classed("vowel-text", true)
        .attr("x", d => d.x + 5)
        .attr("y", d => d.y - 5)
        .style("fill", d => d.rounded ? "blue" : "black") // no longer animated
        .text(d => { return d.symbol });

    // visible vowels
    gs.append("circle")
        .classed("vowel-circle", true)
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("r", 5)
        .style("pointer-events", "none")
        .style("fill", "#69b3a2")
        .attr("alt", d => d.filename);

    // clickable vowels
    gs.append("circle") 
        .classed("vowel-bounds", true)
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("r", 8)
        .style("fill", "transparent")
        .style("cursor", d => d.symbol === "ʊ̝" ? "help" : "pointer")
        .on("click", function (_, d) {
            var audio = new Audio("./vowels/" + d.filename);
            if (enableReferenceVowels) {
                audio.play();
            }
            // stop propagation
        })
        // allow the mouse dragged over a circle to still have formants continuously updated
        // most noticable is with ä
        .on("mousemove", function (e) {
            let f1 = y.invert(d3.pointer(e)[1]);
            let f2 = x.invert(d3.pointer(e)[0]);
            // console.log(f1, f2);
            if (e.buttons === 1) {
                changeVowel({ F1: f1, F2: f2 });
            }
        });

}).then(() => {
    loadLexicalSets(vowelData);
    
});

// on mouseup, stop all vowels
document.addEventListener("mouseup", function () {
    stopVowel();
});
