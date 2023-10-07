// @ts-ignore
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

export class Formant {
    oscillator: OscillatorNode;
    filter: BiquadFilterNode;
    gainNode: GainNode;

    bandwidth: number = 60;
    baseVolume: number = 1;
    relativeVolume: number = 1;
    _fvalue: number = 0;



    _on: boolean = false;
    _init: boolean = false;

    get value() {
        return this._fvalue;
    }
    set value(value: number) {
        this._fvalue = value;
        this.filter.frequency.setValueAtTime(value, audioCtx.currentTime);
        this.filter.Q.setValueAtTime(this.bandwidth, audioCtx.currentTime);
    }
    constructor(relativeVolume: number = 1) {
        const oscillator = audioCtx.createOscillator();
        this.oscillator = oscillator;
        oscillator.type = "square";
        oscillator.frequency.setValueAtTime(87, audioCtx.currentTime);
        const filter = audioCtx.createBiquadFilter();
        this.filter = filter;
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(1000, audioCtx.currentTime);
        filter.Q.setValueAtTime(this.bandwidth, audioCtx.currentTime);
        oscillator.connect(filter);

        // reduce the volume
        const gainNode = audioCtx.createGain();
        this.gainNode = gainNode;
        this.relativeVolume = relativeVolume;
        filter.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        this.stop();
        (window as any).oscillator = oscillator;
    }
    init() {
        this.oscillator.start();
    }
    start() {
        if (!this._init) {
            this.init();
            this._init = true;
        }
        // console.log("starting oscillator "+ this.relativeVolume);
        this._on = true;
        this.gainNode.gain.setValueAtTime(this.baseVolume * this.relativeVolume, audioCtx.currentTime);
    }

    stop() {
        this.gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        this._on = false;
    }
}


export const formants = [new Formant(1), new Formant(0.6), new Formant(0.25)];
(window as any).formants = formants;
function init() {
    formants.forEach(f => f.init());
}
(window as any).init = init;
export function startVowel(vowel: { F1: number, F2: number, F3?: number }) {
    const f1 = vowel.F1;
    const f2 = vowel.F2;
    formants[0].value = f1;
    formants[1].value = f2;
    formants.forEach(f => f.start());
    // setTimeout(() => {
    //   formants.forEach(f => f.stop());
    // }, 1500);
}
export function changeVowel(vowel: { F1: number, F2: number, F3?: number }) {
    const f1 = vowel.F1;
    const f2 = vowel.F2;
    formants[0].value = f1;
    formants[1].value = f2;
}
// (window as any).playVowel = playVowel;

export function stopVowel() {
    formants.forEach(f => f.stop());
}