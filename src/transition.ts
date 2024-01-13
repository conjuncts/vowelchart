import * as d3 from "d3";

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
    opacityAttr: string, minOpacity: 0, maxOpacity: any, duration: number) {
    if (enable) {
        selection.filter('.' + hidingClass)
            // .attr(opacityAttr, minOpacity)
            .style(opacityAttr, minOpacity)
            .classed(hidingClass, false);
    }

    let selectionE = selection.transition()
        .duration(duration)
        // .attr(opacityAttr, enable ? maxOpacity : minOpacity)
        .style(opacityAttr, enable ? maxOpacity : minOpacity);

    if (!enable) {
        selectionE.on("end", function () {
            d3.select(this).classed(hidingClass, true);
        });
    }

}

export function fadeInOutAttr(enable: boolean, selection: d3.Selection<d3.BaseType, any, d3.BaseType, unknown>, hidingClass: string,
    opacityAttr: string, minOpacity: 0, maxOpacity: any, duration: number) {
    if (enable) {
        selection.filter('.' + hidingClass)
            // .attr(opacityAttr, minOpacity)
            .style(opacityAttr, minOpacity)
            .classed(hidingClass, false);
    }

    let selectionE = selection.transition()
        .duration(duration)
        // .attr(opacityAttr, enable ? maxOpacity : minOpacity)
        .attr(opacityAttr, enable ? maxOpacity : minOpacity);

    if (!enable) {
        selectionE.on("end", function () {
            d3.select(this).classed(hidingClass, true);
        });
    }

}