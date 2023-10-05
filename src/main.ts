
// import typescriptLogo from './typescript.svg'
// import viteLogo from '/vite.svg'
// import { setupCounter } from './counter.ts';

import * as d3 from 'd3';

// setupCounter(document.querySelector<HTMLButtonElement>('#counter')!);

type Vowel = {
  Filename: string;
  Symbol: string;
  F1: number;
  F2: number;
  F3: number;
}

// set the dimensions and margins of the graph
const margin = { top: 10, right: 30, bottom: 30, left: 60 },
  width = 690 - margin.left - margin.right, // 460
  height = 600 - margin.top - margin.bottom; // 400

// append the svg object to the body of the page
const svg = d3.select("#my_dataviz")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`);

//Read the data
d3.tsv("https://gist.githubusercontent.com/conjuncts/906d86ae5fa0d9b922bcc1197e2e40f4/raw/b34290f31929ef77fd039e524c27a472c61b069c/vowelchart.tsv").then(function (data) {

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
    .domain([850, 175])
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

  // Add dots
  // svg.append('g')
  //   .selectAll("dot")
  //   .data(data)
  //   .join("circle")
  //   .attr("cx", function (d) { return x(d.F2 as any); })
  //   .attr("cy", function (d) { return y(d.F1 as any); })
  //   .attr("r", 3)
  //   .style("fill", "#69b3a2");

  // console.log(data);
  let gs = svg.append('g')
    .selectAll("text")
    .data(data)
    .enter()
    .append("g");

  gs.append("text")
    .attr("x", d => x(d.F2 as any) + 5) // Adjust the position as needed
    .attr("y", d => y(d.F1 as any) - 5) // Adjust the position as needed
    .text(d => { console.log(d.Symbol); return d.Symbol }); // Text content

  // .data(data)
  // .enter()
  gs.append("circle")
    .attr("cx", function (d) { return x(d.F2 as any); })
    .attr("cy", function (d) { return y(d.F1 as any); })
    .attr("r", 5)
    .style("fill", "#69b3a2");
    // .attr("alt", d => d.Filename);

  gs.append("circle") // bounding circle
    .attr("cx", function (d) { return x(d.F2 as any); })
    .attr("cy", function (d) { return y(d.F1 as any); })
    .attr("r", 10)
    .style("fill", "transparent")
    .style("cursor", "pointer")
    .on("click", function () {
      var d = d3.select(this).datum() as Vowel;
      var audio = new Audio("./vowels/" + d.Filename);
      audio.play();
      console.log("playing " + d.Filename);

    });

  // add dotted line edges between these vowels: i, e, ɛ, æ, a, ɑ, ɒ, ɔ, o, u
  // to signify the frontier
  let vowels = ["i", "e", "ɛ", "æ", "a", "ɑ", "ɒ", "ɔ", "o", "u"];
  let vowelsData = data.filter(d => vowels.includes(d.Symbol));
  let vowelsDataSorted = vowelsData.sort((a, b) => vowels.indexOf(a.Symbol) - vowels.indexOf(b.Symbol));
  let vertices = vowelsDataSorted.map(d => [x(d.F2 as any), y(d.F1 as any)]);
  console.log(vertices);

  const curve = d3.line().curve(d3.curveMonotoneX);

  svg.append('path')
    .attr('d', curve(vertices as any))
    .attr('stroke', 'black')
    .attr('fill', 'none')

    // dotted lines
    .attr('stroke-dasharray', '5,5')
    .style("pointer-events", "none")
    .style("z-index", "-99");



});