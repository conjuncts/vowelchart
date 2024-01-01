import { Diphthong } from "./vowels";

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