
import * as d3 from 'd3';


export function toggleReferenceRecordings(enable?: boolean) {
    if(enable === undefined) {
        
        enable = (document.getElementById('play-reference') as HTMLInputElement).checked;
    }
    let referenceRecordings = document.getElementsByClassName("vowel-bounds") as unknown as SVGCircleElement[];
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

    if (enable) {
        d3.selectAll('.lex-circle').transition()
            .duration(200)
            .attr("r", 20);
        d3.selectAll('.lex-text').transition()
            .duration(200)
            .style("opacity", "1");
        setTimeout(() => {
            d3.selectAll(".vowel-text").style("fill", "#A9A9A9");
        }, 100);
        // d3.selectAll(".vowel-text").transition()
        //     .duration(200)
        //     .style("fill", "#A9A9A9"); // "#4B8073");
        for(let x of document.getElementsByClassName("lex-only")) {
            x.classList.remove("hidden");
        }
    } else {
        d3.selectAll('.lex-circle').transition()
            .duration(200)
            .attr("r", 0);
        d3.selectAll('.lex-text').transition()
            .duration(200)
            .style("opacity", "0");
        setTimeout(() => {
            // d3.selectAll(".lex-text").style("opacity", "0");
            d3.selectAll(".vowel-text").style("fill", "black");
        }, 100);
        for (let x of document.getElementsByClassName("lex-only")) {
            x.classList.add("hidden");
        }
        
    }
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
    
    d3.selectAll(".lex-diph-text")
        .transition()
        .duration(200)
        .style("opacity", enable ? "1" : "0");

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

