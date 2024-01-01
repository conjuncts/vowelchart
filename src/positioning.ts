import * as d3 from 'd3';
import { LexicalSet } from "./lexsets";
import { Diphthong, MixedVowel } from "./vowels";
import { DiphthongScheduler } from './synthesis';

export function positionDiphText(diph: Diphthong): [number, [number, number]] {
    let dy = diph.end.y - diph.start.y;
    let dx = diph.end.x - diph.start.x;
    let midpoint = [diph.start.x + dx / 3, diph.start.y + dy / 3] as [number, number];
    // 1/3 point has fewer collision
    let rotation = Math.atan2(dy,
        dx) * 180 / Math.PI;

    if (-270 <= rotation && rotation <= -90) {
        rotation += 180;
    }
    return [rotation, midpoint];

}

export function positionLexset(lexset: LexicalSet, pos: MixedVowel, was?: MixedVowel) {
    let node = d3.select(`.lex-${lexset.name}`);

    if (pos instanceof Diphthong) {
        if (was instanceof Diphthong) {
            // diph to diph
            if (pos.start === was.start && pos.end === was.end) {
                // console.log("skipping");
                return;
            }
        } else {
            // mono to diph
            // animate the path
            let start = [pos.start.x, pos.start.y] as [number, number];
            let end = [pos.end.x, pos.end.y] as [number, number];
            node.select(".lex-path")
                .transition()
                .duration(500)
                .attr('d', d3.line()([start, end]))
                .attr('stroke-opacity', 0.5)
                .attr("marker-end", lexset.rhotic ?
                    "url(#diph-rho-arrowhead)" : "url(#diph-arrowhead)");

            // animate the text
            let [rotation, midpoint] = positionDiphText(pos);

            let txt = node.select(".lex-text")
                .classed("lex-diph-text", true);
            if (lexset.name === "CURE") {
                txt.attr('transform',
                    `rotate(${rotation}, ${was!.x}, ${was!.y})`); // animation is broken
            }
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
    } else {
        // monophthong            
        if (was instanceof Diphthong) {
            // diph to mono
            let start = [pos.x, pos.y] as [number, number];
            node.select(".lex-path")
                .transition()
                .duration(500)
                .attr('d', d3.line()([start, start]))
                .attr('stroke-opacity', 0)
                .attr("marker-end", null);
            
            node.select(".lex-circle")
                .transition()
                .duration(300)
                .attr("r", 20);

            // animate the text

            let txt = node.select(".lex-diph-text");
            if (lexset.name === "CURE") {
                txt.attr('transform',
                    `rotate(0)`);
            }
            txt.classed("lex-diph-text", false)
                .transition()
                .duration(300)
                .attr("x", pos.x)
                .attr("y", pos.y)
                .attr('transform',
                    `translate(${pos.dx + 5}, ${pos.dy + 10}) rotate(0, ${pos.x}, ${pos.y})`);
            return;
        }
        // mono to mono
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
    return node;
}

export function createDiphthongPlayer(diph: Diphthong) {
    let player = new DiphthongScheduler(diph.start, diph.end);
    let diphGroup = d3.select("#svg-diphs");

    return diphGroup.append("path")
        .attr("d", d3.line()([[diph.start.x, diph.start.y], [diph.end.x, diph.end.y]]))
        .classed("diph-bounds", true)
        // hidden - animated
        .attr('stroke', 'white') // this just needs to be here
        .attr('stroke-opacity', 0)
        .attr('stroke-width', 10)
        .style("cursor", "pointer")
        .on("click", function () {
            player.play();
        });
}