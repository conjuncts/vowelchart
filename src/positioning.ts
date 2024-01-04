import * as d3 from 'd3';
import { LexicalSet, lexsetData } from "./lexsets";
import { AdjustedVowel, Diphthong, Vowel, VowelPositionState, isVowel } from "./vowels";

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


export function positionLexset(lexset: LexicalSet, pos: AdjustedVowel | Diphthong, was?: AdjustedVowel | Diphthong): 
    d3.Selection<d3.BaseType, unknown, HTMLElement, any> {
    let node = d3.select(`.lex-${lexset.name}`);

    if (pos instanceof Diphthong) {
        if (was instanceof Diphthong) {
            // diph to diph
            if (pos.start === was.start && pos.end === was.end) {
                // console.log("skipping");
                return node;
            }
        }
        // undefined, mono, or diph to diph
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
        
        // animate the bound
        node.select(".diph-bounds")
            .transition()
            .duration(500)
            .attr('d', d3.line()([start, end]));
        
        
        // animate the text
        let [rotation, midpoint] = positionDiphText(pos);

        let txt = node.select(".lex-text")
            .classed("lex-diph-text", true);
        if (lexset.name === "CURE" && isVowel(was)) {
            txt.attr('transform',
                `rotate(${rotation}, ${was.x}, ${was.y})`); // animation is broken
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
            return node;
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
    lexset.position = pos;
    return node;
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
    
    let diphs = document.getElementById("svg-lex");
    for(let diph of diphs!.getElementsByClassName("lex-diph")) {
        let name = undefined;
        for(let cls of diph.classList) {
            if(cls === 'lex-diph') continue;
            if(cls.startsWith("lex-")) {
                name = cls.substring(4);
                break;
            }
        }
        let lexset = lexsetData.get(name!)!;
        let pos = lexset.position;
        positionLexset(lexset, pos!);
        console.log("foo");
        
    }
    
}


export class LexSnapshot {
    data: Map<LexicalSet, AdjustedVowel | Diphthong>;
    constructor(data: Map<LexicalSet, AdjustedVowel | Diphthong>) {
        this.data = data;
    }
    computeAdjustments(pos: Vowel, checkCollisionsWith?: Iterable<AdjustedVowel>): 
        AdjustedVowel {
        if(checkCollisionsWith === undefined) {
            checkCollisionsWith = [];
            for(let pos of this.data.values()) {
                if(pos === undefined) continue;
                if(pos instanceof Diphthong) continue;
                (checkCollisionsWith as AdjustedVowel[]).push(pos);
            }
        }
        
        let atx = pos.x;
        let aty = pos.y;
        let textx = atx;
        let texty = aty;
        // prevent at same position
        for (let pos of checkCollisionsWith) {
            if (Math.abs(pos.vowel.x + pos.dx - textx) < 10 && Math.abs(pos.vowel.y + pos.dy - texty) < 10) {
                texty += 10; // works since duplicates are handled ascending
            }
        }
        let out = new AdjustedVowel(pos, 
            textx - atx,
            texty - aty
        );
        return out;
        
        
    }
}