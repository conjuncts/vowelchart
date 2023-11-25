

import * as d3 from 'd3';
import { DiphthongScheduler, changeVowel, startVowel, stopVowel } from './synthesis';
import { toggleReferenceRecordings, toggleDiphthongs, hydrateTabs } from './tabs';
import { diphs, loadLexicalSets } from './lexsets';
import { Vowel } from './vowels';
(window as any).toggleReferenceRecordings = toggleReferenceRecordings;
(window as any).toggleDiphthongs = toggleDiphthongs;

// setupCounter(document.querySelector<HTMLButtonElement>('#counter')!);
hydrateTabs();

export let enableReferenceVowels = true;

// set the dimensions and margins of the graph
const margin = { top: 10, right: 30, bottom: 30, left: 60 },
    width = 690 - margin.left - margin.right, // 460
    height = 600 - margin.top - margin.bottom; // 400

// append the svg object to the body of the page
const svg = d3.select("#vowelchart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

let topOffset = 20;
let rightOffset = 40;
// Add X axis
const x = d3.scaleLinear()
    .domain([2500, 500])
    .range([0, width - rightOffset]);
svg.append("g")
    .attr("transform", `translate(0, ${topOffset})`)
    .style("user-select", "none")
    .call(d3.axisTop(x));
svg.append("text")
    .attr("y", 2)
    .attr("x", 0)
    .attr("text-anchor", "middle")
    .text("F2");

// Add Y axis
const y = d3.scaleLinear()
    .domain([860, 175])
    .range([height, topOffset]);
svg.append("g")
    .attr("transform", `translate(${width - rightOffset}, 0)`)
    .style("user-select", "none")
    .call(d3.axisRight(y));

svg.append("text")
    .attr("y", height)
    .attr("x", width)
    .attr("text-anchor", "middle")
    .text("F1");

svg.append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", width - rightOffset)
    .attr("height", height)
    .style("fill", "transparent")
    .style("z-index", "1")
    // .style("cursor", "pointer")
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


//Read the data
// d3.tsv("https://gist.githubusercontent.com/conjuncts/906d86ae5fa0d9b922bcc1197e2e40f4/raw/b34290f31929ef77fd039e524c27a472c61b069c/vowelchart.tsv").then(function (data) {
let vowelData: Record<string, Vowel> = {};

d3.tsv("formants.tsv").then(function (data) {
    // put data
    data.forEach((d: any) => {
        let process = d;
        process["F1"] = +d["F1"];
        process["F2"] = +d["F2"];
        process["F3"] = +d["F3"];

        vowelData[d.symbol] = process;
    });
    console.log('vowel formants:', data);

    // add dotted line edges between these vowels: i, e, ɛ, æ, a, ɑ, ɒ, ɔ, o, u to signify frontier
    let frontier = ["i", "e", "ɛ", "æ", "a", "ɑ", "ɒ", "ɔ", "o", "u"];
    let vertices = frontier.map(d => [x(vowelData[d].F2), y(vowelData[d].F1)]);

    const curve = d3.line().curve(d3.curveMonotoneX);

    // dotted lines
    svg.append('path')
        .attr('d', curve(vertices as any))
        .attr('stroke', 'black')
        .attr('fill', 'none')
        .attr('stroke-dasharray', '5,5')
        .style("pointer-events", "none")
        .style("z-index", "-99");

    // begin data points
    let gs = svg.append('g')
        .selectAll("text")
        .data(data)
        .enter()
        .append("g");

    gs.append("text")
        .classed("vowel-text", true)
        .attr("x", d => x(d.F2 as any) + 5)
        .attr("y", d => y(d.F1 as any) - 5)
        .style("fill", "black") // animated
        .text(d => { return d.symbol });

    // .data(data)
    // .enter()

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
        .style("cursor", d => d.symbol === "ʊ̞" ? "help" : "pointer")
        .on("click", function () {
            var d = d3.select(this).datum() as Vowel;
            var audio = new Audio("./vowels/" + d.filename);
            if (enableReferenceVowels) {
                audio.play();
            }
            // stop propagation
        })
        .on("mouseup", function () {
            stopVowel();
        });


    // add diphthongs
    // let diph = ["a", "ɪ"].map(s => formantData[s]);

    for (let diphstr of diphs) {
        let diph = diphstr.map(s => vowelData[s]);

        let player = new DiphthongScheduler(diph[0], diph[1]);

        // visible diphthongs
        svg.append("path")
            .attr("d", curve([[x(diph[0].F2), y(diph[0].F1)], [x(diph[1].F2), y(diph[1].F1)]]))
            .classed("diph-paths", true)
            .attr('stroke', '#3b3bb3')
            .attr('stroke-opacity', 0); // animated

        // clickable diphthongs
        svg.append("path")
            .attr("d", curve([[x(diph[0].F2), y(diph[0].F1)], [x(diph[1].F2), y(diph[1].F1)]]))
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
