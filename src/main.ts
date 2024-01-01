

import * as d3 from 'd3';
import { DiphthongScheduler, changeVowel, startVowel, stopVowel } from './synthesis';
import { toggleReferenceRecordings, toggleDiphthongs, toggleRP, hydrateTabs } from './tabs';
import { loadLexicalSets } from './lexsets';
import { diphs, PositionedVowel, positionVowel, Vowel } from './vowels';
(window as any).toggleReferenceRecordings = toggleReferenceRecordings;
(window as any).toggleDiphthongs = toggleDiphthongs;
(window as any).toggleRP = toggleRP;

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
const x = d3.scaleLinear()
    .domain([2500, 500])
    .range([0, width - rightOffset]);
axes.append("g")
    .attr("transform", `translate(0, ${topOffset})`)
    .style("user-select", "none")
    .call(d3.axisTop(x));
const y = d3.scaleLinear()
    .domain([860, 175])
    .range([height, topOffset]);
axes.append("g")
    .attr("transform", `translate(${width - rightOffset}, 0)`)
    .style("user-select", "none")
    .call(d3.axisRight(y));

// vowel synthesis playback
svg.append("rect")
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
let vowelData: Record<string, PositionedVowel> = {};

d3.tsv("formants.tsv").then(function (data) {
    // put data
    data.forEach((d: any) => {
        let process = d;
        process["F1"] = +d["F1"];
        process["F2"] = +d["F2"];
        process["F3"] = +d["F3"];
        d["rounded"] = d["filename"].includes("_rounded");
        d["show"] = d["filename"] !== "hidden.ogg.mp3";
        vowelData[d.symbol] = positionVowel(process, x, y, []);
    });
    console.log('vowel formants:', vowelData);

    // add dotted line edges between these vowels: i, e, ɛ, æ, a, ɑ, ɒ, ɔ, o, u to signify frontier
    let frontier = ["i", "e", "ɛ", "æ", "a", "ä", "ɑ", "ɒ", "ɔ", "o", "u"];
    let vertices = frontier.map(d => [x(vowelData[d].F2), y(vowelData[d].F1)]);

    const curve = d3.line().curve(d3.curveMonotoneX);

    // dotted lines
    svg.append('path')
        .attr('d', curve(vertices as any))
        .attr('stroke', 'black')
        .attr('fill', 'none')
        .attr('stroke-dasharray', '5,5')
        .style("pointer-events", "none")
        // .style("user-select", "none")
        .style("z-index", "-99");

    // begin data points
    let gs = svg.append('g')
        .attr("id", "svg-vowels")
        .selectAll("text")
        .data(Object.values(vowelData).filter(d => d.show))
        .enter()
        .append("g");

    gs.append("text")
        .classed("vowel-text", true)
        .attr("x", d => x(d.F2 as any) + 5)
        .attr("y", d => y(d.F1 as any) - 5)
        .style("fill", d => d.rounded ? "blue" : "black") // no longer animated
        .text(d => { return d.symbol });

    // visible vowels
    gs.append("circle")
        .attr("cx", function (d) { return x(d.F2 as any); })
        .attr("cy", function (d) { return y(d.F1 as any); })
        .attr("r", 5)
        .style("pointer-events", "none")
        .style("fill", "#69b3a2")
        .attr("alt", d => d.filename);

    // clickable vowels
    gs.append("circle") 
        .classed("vowel-bounds", true)
        .attr("cx", function (d) { return x(d.F2 as any); })
        .attr("cy", function (d) { return y(d.F1 as any); })
        .attr("r", 8)
        .style("fill", "transparent")
        .style("cursor", d => d.symbol === "ʊ̝" ? "help" : "pointer")
        .on("click", function () {
            var d = d3.select(this).datum() as Vowel;
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


    // add diphthongs
        
    let diphGroup = svg.insert("g", "#svg-vowels").attr("id", "svg-diphs");
    for (let diphstr of diphs) {
        continue;
        let diph = diphstr.map(s => vowelData[s]);

        let player = new DiphthongScheduler(diph[0], diph[1]);

        // visible diphthongs
        let start = [x(diph[0].F2), y(diph[0].F1)] as [number, number];
        let end = [x(diph[1].F2), y(diph[1].F1)] as [number, number];
        // // let percent = .92;
        let end_adjusted = end;
        // // [percent * end[0] + (1 - percent) * start[0], 
        // //     percent * end[1] + (1 - percent) * start[1]] as [number, number];
        // diphGroup.append("path")
        //     .attr("d", curve([start, end_adjusted]))
        //     .classed("lex-path", true)
        //     .attr('stroke', '#3b3bb3')
        //     .attr('stroke-dasharray', '10,10')
        //     .attr("marker-end", "url(#diph-arrowhead)")
        //     .attr('stroke-opacity', 0); // animated

        // clickable diphthongs
        diphGroup.append("path")
            .attr("d", curve([start, end_adjusted]))
            .classed("diph-bounds", true)
            .style("display", "none") // animated
            .attr('stroke', 'white') // this just needs to be here
            .attr('stroke-opacity', 0)
            .attr('stroke-width', 10)
            .style("cursor", "pointer")
            .on("click", function () {
                player.play();
            });

    }
}).then(() => {
    loadLexicalSets(svg, vowelData, x, y);
    
});

// on mouseup, stop all vowels
document.addEventListener("mouseup", function () {
    stopVowel();
});
