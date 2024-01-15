import * as d3 from "d3";
import { AdjustedPosition, AdjustedVowel, Diphthong, isAdjustedPosition, toStartEnd } from "./vowels";
import { positionDiphText } from "./positioning";
import { LexicalSet, Lexsets } from "./lexsets";
import { DiphthongScheduler } from "./synthesis";

/**
 * Helper transition which fades in or out a selection upon the addition or removal of a hiding class.
 * For example, if you have a class "hidden" which sets opacity to 0, you can use this function to fade in or out
 * 
 * If there is an additional hiding class, this will create a transition but nothing will happen because the element is hidden
 * --> a bit of wasted computation
 * @param enable Whether we wish to make the element visible or invisible; toggles the hidingClass accordingly
 * 
 * Caveat: there can only be one transition
 * @param selection 
 * @param hidingClass 
 * @param opacityAttr 
 * @param maxOpacity 
 * @param duration 
 */
export function fadeInOut(enable: boolean, selection: d3.Selection<d3.BaseType, any, d3.BaseType, unknown>, hidingClass: string,
    opacityAttr: string, minOpacity: 0, maxOpacity: any, duration: number, transitionName?: string) {
    if (enable) {
        selection.filter('.' + hidingClass)
            // .attr(opacityAttr, minOpacity)
            .style(opacityAttr, minOpacity)
            .classed(hidingClass, false);
    }

    let selectionE = selection.transition(transitionName)
        .duration(duration)
        .style(opacityAttr, enable ? maxOpacity : minOpacity);

    if (!enable) {
        selectionE.on("end", function () {
            d3.select(this).classed(hidingClass, true);
        });
    }

}

export function fadeInOutAttr(enable: boolean, selection: d3.Selection<d3.BaseType, any, d3.BaseType, unknown>, hidingClass: string,
    opacityAttr: string, minOpacity: 0, maxOpacity: any, duration: number, transitionName: string = hidingClass) {
    if (enable) {
        selection.filter('.' + hidingClass)
            .attr(opacityAttr, minOpacity)
            .classed(hidingClass, false);
    }

    let selectionE = selection.transition(transitionName)
        .duration(duration)
        // .attr(opacityAttr, enable ? maxOpacity : minOpacity)
        .attr(opacityAttr, enable ? maxOpacity : minOpacity);

    if (!enable) {
        selectionE.on("end", function () {
            d3.select(this).classed(hidingClass, true);
        });
    }

}


function createNew(newNodes: d3.Selection<SVGGElement, LexicalSet, d3.BaseType, unknown>,
    showLex = true, showDiphs = true, transition = 200) {
    newNodes.classed("lexset", true);
    newNodes.each(function (lexset) {
        this.classList.add(`lex-${lexset.name}`);
        // the above is no longer needed, but it can be useful for debugging

        let pos = lexset.position;
        if (pos instanceof Diphthong) {
            this.classList.add("lex-diph");
        } else if (pos instanceof AdjustedVowel) {
            // pass
        } else if (pos === undefined) {
            console.error("warning: undefined position", lexset.name, lexset);
        } else {
            console.log("neither diph nor pos", lexset.name, lexset);
            return;
        }
    });

    // new paths. paths are exception to diph-togglable
    let newP = newNodes.append("path")
        .classed("lex-path", true)
        .attr('stroke-dasharray', '10,10')
        .each(function (lexset) {

            let path = d3.select(this);
            if (lexset.position !== undefined) {
                path.attr("d", d3.line()(toStartEnd(lexset.position)))
                    .attr('stroke-opacity', 0); // animated
            }
            path.attr('stroke', lexset.rhotic ? 'darkorchid' : '#3b3bb3');
        });
    if (showDiphs) {
        newP.transition().duration(transition * 5 / 2)
            .attr('stroke-opacity', lexset =>
                lexset.position instanceof Diphthong ? 0.5 : 0); // animated
    }

    // new circles
    let newC = newNodes.append("circle")
        .classed("lex-circle", true)
        .style("fill", "#69b3a222")
        // .classed("lex-unused", lexset => lexset.position instanceof Diphthong)
        .attr("cx", -9999)
        .attr("cy", -9999)
        .filter(lexset => isAdjustedPosition(lexset.position))
        .attr("cx", lexset => (lexset.position as AdjustedPosition).x)
        .attr("cy", lexset => (lexset.position as AdjustedPosition).y)
        .attr("r", 0); // animated
    if (showLex) {
        newC.transition().duration(transition)
            .attr("r", 20);
    }

    // new text
    let newT = newNodes.append("text")
        .classed("lex-text", true)
        .classed("diph-hidden", lexset => lexset.position instanceof Diphthong && !showDiphs)
        .classed("lex-rhotic", lexset => lexset.rhotic!) // assume that this cannot change
        .style("opacity", 0); // animated
    if (showLex) {
        newT.transition().duration(transition * 3 / 2)
            .style("opacity", "1"); // animated
    }

    // new bounds
    newNodes
        .append('path')
        .classed("diph-bounds", true)
        .filter(lexset => lexset.position instanceof Diphthong)
        // hidden - animated
        .attr('stroke', 'white') // this just needs to be here
        .attr('stroke-opacity', 0)
        .attr('stroke-width', 10)
        .style("cursor", "pointer")
        .each(function (lex) {
            let diph = lex.position;
            if (!(diph instanceof Diphthong)) return;
            let player = new DiphthongScheduler(diph.start, diph.end);
            // diphGroup
            d3.select(this).on("click", () => player.play());

            // bounds
            if (!diph.end) return;
            //     .attr('stroke', '#69b3a222')
            //     .attr('stroke-linecap', 'round')

        });
}

function updateExisting(update: d3.Selection<SVGGElement, LexicalSet, d3.BaseType, unknown>,
    showLex = true, showDiphs = true, transition = 200) {
    // update circles
    update.select("circle.lex-circle")
        .attr("alt", lexset => lexset.displayName)
        .transition().duration(transition)
        .attr("r", lexset => showLex && !(lexset.position instanceof Diphthong) ? 20 : 0)
        // animated, as required when changing from diph to mono
        .filter(lexset => isAdjustedPosition(lexset.position))
        .attr("cx", lexset => (lexset.position as AdjustedPosition).x)
        .attr("cy", lexset => (lexset.position as AdjustedPosition).y);

    update.classed("lex-diph", lexset => lexset.position instanceof Diphthong);

    // updating existing paths
    let paths = update.select("path.lex-path");
    // .attr('stroke', lexset => lexset.rhotic ? 'darkorchid' : '#3b3bb3');

    paths.each(function (lexset) { // path is exception to diphTogglable

        let isdiph = lexset.position instanceof Diphthong;
        let path = d3.select(this);
        let anim = path as
            d3.Transition<d3.BaseType, unknown, null, undefined> | d3.Selection<d3.BaseType, unknown, null, undefined>;
        if (showLex) anim = path.transition().duration(transition * 5 / 2);
        anim.attr('stroke-opacity', isdiph ? 0.5 : 0); // animated
        if (lexset.position === undefined) return;

        anim.attr("d", d3.line()(toStartEnd(lexset.position)));

    });
}
// let lexsetPositions: Map<string, PositionedVowel> = new Map();
// normal: 200
// debug: 1000
export function updateLexsets(lexsetData: Lexsets, showLex = true, showDiphs = true, transition = 200) {
    // showDiphs is only relevant when creating new nodes so we can apply the diph-hidden filter
    // how diphs are toggled: 
    // 1. lex-path stroke opacity
    // 2. diph-arrowhead toggle

    // let update = 
    let joined = d3.select("#svg-lex")
        .selectAll<SVGGElement, LexicalSet>("g")
        .data([...lexsetData.values()], (d: LexicalSet) => d.name)
        .join(
            enter => {
                // new node initialization
                let newNodes = enter.append("g");
                createNew(newNodes, showLex, showDiphs, transition);
                return newNodes;
            },
            update => {
                updateExisting(update, showLex, showDiphs, transition);
                return update;
            },
            exit => {
                exit.remove();
            }
        )

    // console.log("update lexset");

    joined.select("path.lex-path")
        .attr("marker-end", function (lexset) {
            if (lexset.position instanceof Diphthong) {
                return lexset.rhotic ? "url(#diph-rho-arrowhead)" : "url(#diph-arrowhead)"
            }
            return null;
        });

    // update text
    joined.select("text.lex-text")
        .text(lexset => lexset.displayName)
        .classed("diph-tog", lexset => lexset.position instanceof Diphthong)
        .each(function (lexset) {
            let x;
            let y;
            let transform;
            let pos = lexset.position;
            if (pos instanceof Diphthong) {
                let [rotation, midpoint] = positionDiphText(pos);
                // if (!showDiphs) d3.select(this).classed("diph-hidden", true);
                x = midpoint[0];
                y = midpoint[1];
                transform = `rotate(${rotation}, ${midpoint[0]}, ${midpoint[1]})`;
            } else if (isAdjustedPosition(pos)) {
                if (lexset.name === 'NEAR') {
                    // console.log('readjusting');
                }
                x = pos.x;
                y = pos.y;
                transform = `translate(${pos.dx + 5}, ${pos.dy + 10})`;
                d3.select(this).classed("diph-hidden", false);
            } else {
                console.log("neither diph nor pos here", lexset.name, lexset);
                return;
            }
            d3.select(this).transition().duration(transition * 3 / 2)
                .style("opacity", showLex && (isAdjustedPosition(lexset.position) || showDiphs) ? 1 : 0)
                .attr("x", x)
                .attr("y", y)
                .attr('transform', transform)
                .text(lexset.displayName)
                .on('end', function () {
                    d3.select(this).classed("diph-hidden", lexset.position instanceof Diphthong && !showDiphs);
                });
        });

    // update the bound instantaneously
    joined.select(".diph-bounds")
        .attr('d', function (lexset) {
            let [start, end] = toStartEnd(lexset.position!);
            return d3.line()([start, end]);
        });

    d3data = joined;
    return joined;

}
export let d3data: d3.Selection<SVGGElement, LexicalSet, d3.BaseType, unknown>;
