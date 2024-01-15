import * as d3 from 'd3';
import { LexicalSet } from "./lexsets";
import { d3data } from "./transition";
import { Diphthong, Vowel, VowelPositionState } from "./vowels";


export function positionDiph(node: d3.Selection<d3.BaseType, unknown, any, any>, lex: LexicalSet, diph: Diphthong) {
    // undefined, mono, or diph to diph
    // animate the path
    let start = [diph.start.x, diph.start.y] as [number, number];
    let end = [diph.end.x, diph.end.y] as [number, number];
    node.select(".lex-path")
        .transition()
        .duration(500)
        .attr('d', d3.line()([start, end]))
        .attr('stroke-opacity', 0.5)
        .attr("marker-end", lex.rhotic ?
            "url(#diph-rho-arrowhead)" : "url(#diph-arrowhead)");

    // animate the bound
    node.select(".diph-bounds")
        .transition()
        .duration(500)
        .attr('d', d3.line()([start, end]));


    // animate the text
    let [rotation, midpoint] = diph.positionDiphText();

    let txt = node.select(".lex-text")
        .classed("lex-diph-text", true);
    // if (lexset.name === "CURE" && isVowel(was)) {
    //     txt.attr('transform',
    //         `rotate(${rotation}, ${was.x}, ${was.y})`); // animation is broken
    // }
    let trans = txt.transition()
        .duration(300);
    trans.attr("x", midpoint[0])
        .attr("y", midpoint[1])
        .attr('transform',
            `rotate(${rotation}, ${midpoint[0]}, ${midpoint[1]})`)
        .style("opacity", "1");

    // clean up old
    node.select(".lex-circle")
        .transition()
        .duration(300)
        .attr("r", 0);
        
}


export function repositionVowels(
    d3gs: d3.Selection<SVGGElement, Vowel, SVGGElement, unknown>, state: VowelPositionState) {
    (d3gs.selectAll(".vowel-circle") as
        d3.Selection<SVGCircleElement, Vowel, SVGGElement, unknown>)
        .transition()
        .duration(500)
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);
    (d3gs.selectAll(".vowel-text") as
        d3.Selection<SVGCircleElement, Vowel, SVGGElement, unknown>)
        .transition()
        .duration(500)
        .attr("x", d => d.x + (state === VowelPositionState.TRAPEZOID ? (d.rounded ? 5 : -5) : 5))
        .attr("y", d => d.y - 5);
    (d3gs.selectAll(".vowel-bounds") as
        d3.Selection<SVGCircleElement, Vowel, SVGGElement, unknown>)
        .transition()
        .duration(500)
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);
    d3data.filter(d => d.position instanceof Diphthong)
        .each(function (d) {
            // @ts-ignore
            positionDiph(d3.select(this), d, d.position as Diphthong)
        });
    return;
    
}

