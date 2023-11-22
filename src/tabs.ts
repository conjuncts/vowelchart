import { onLexsetToggle } from "./lexsets";

import * as d3 from 'd3';


export function toggleReferenceRecordings(enable?: boolean) {
    if(enable === undefined) {
        
        enable = (document.getElementById('play-reference') as HTMLInputElement).checked;
    }
    let referenceRecordings = document.getElementsByClassName("refs-bounds") as unknown as SVGCircleElement[];
    for(let ref of referenceRecordings) {
        if(enable) {
            ref.style.removeProperty("display");
        } else {
            ref.style.display = "none";

        }
    }
}
function isDiphsChecked() {
    return (document.getElementById('toggle-diphs') as HTMLInputElement).checked;
}
function isLexsetMode() {
    return (document.getElementById('radio-2') as HTMLInputElement).checked;
}
export function toggleDiphthongs(enable?: boolean) {
    if (enable === undefined) {
        enable = isDiphsChecked();
    }
    // instantaneously disable cliakable diphthongs
    let bounds = document.querySelectorAll(".diph-bounds") as unknown as SVGCircleElement[];
    for (let bound of bounds) {
        if (enable) {
            bound.style.removeProperty("display");
        } else {
            bound.style.display = "none";
        }
    }
    // animate the paths
    d3.selectAll(".diph-paths")
        .transition()
        .duration(200)
        .attr('stroke-opacity', enable ? 0.5 : 0);
    if(isLexsetMode()) {
        toggleLexsetDiphs(enable);
    }
}

export function toggleLexsets(enable?: boolean) {
    if (enable === undefined) {
        enable = isLexsetMode();
    }

    let bounds = document.getElementsByClassName("lexset") as unknown as SVGCircleElement[];
    for (let bound of bounds) {
        if (enable) {
            bound.style.display = "block";
        } else {
            // bound.style.display = "none";
        }
    }
    onLexsetToggle(enable);
    if(isDiphsChecked()) {
        toggleLexsetDiphs(enable);
    }

}

export function toggleLexsetDiphs(enable: boolean) {
    // isDiphsChecked AND LexsetMode on
    d3.selectAll(".lex-diph-paths")
        .transition()
        .duration(200)
        .attr('stroke-width', enable ? 20 : 0);

}

export function hydrateTabs() {
    document.getElementById('radio-1')?.addEventListener('change', function () {
        toggleLexsets();
    });
    document.getElementById('radio-2')?.addEventListener('change', function () {
        toggleLexsets();
    });
    document.getElementById('radio-3')?.addEventListener('change', function () {
        toggleLexsets();
    });
    document.getElementById('radio-4')?.addEventListener('change', function () {
        toggleLexsets();
    });
}