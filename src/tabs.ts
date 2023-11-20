
export function toggleReferenceRecordings(enable?: boolean) {
    if(enable === undefined) {
        
        enable = (document.getElementById('play-reference') as HTMLInputElement).checked;
    }
    let referenceRecordings = document.getElementsByClassName("refs-bounds") as unknown as SVGCircleElement[];
    for(let ref of referenceRecordings) {
        if(enable) {
            ref.style.removeProperty("display");
            // ref.style.zIndex = "0";
        } else {
            ref.style.display = "none";
            // ref.style.zIndex = "-90";

        }
    }
}
export function toggleDiphthongs(enable?: boolean) {
    if (enable === undefined) {

        enable = (document.getElementById('toggle-diphs') as HTMLInputElement).checked;
        // console.log(enable);
    }
    let bounds = document.getElementsByClassName("diphs-bounds") as unknown as SVGCircleElement[];
    for (let bound of bounds) {
        if (enable) {
            bound.style.removeProperty("display");
            // ref.style.zIndex = "0";
        } else {
            bound.style.display = "none";
            // ref.style.zIndex = "-90";

        }
    }
}