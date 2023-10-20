// @ts-ignore
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

export class Formant {
    oscillator: OscillatorNode;
    filter: BiquadFilterNode;
    gainNode: GainNode;

    bandwidth: number = 60;
    baseVolume: number = 1;
    relativeVolume: number = 1;



    _on: boolean = false;
    // _init: boolean = false;

    get value() {
        // return this._fvalue;
        return this.filter.frequency.value;
    }
    set value(value: number) {
        this.filter.frequency.setValueAtTime(value, audioCtx.currentTime);
        this.filter.Q.setValueAtTime(this.bandwidth, audioCtx.currentTime);
    }
    schedule(value: number, after: number) {
        this.filter.frequency.setValueAtTime(value, audioCtx.currentTime + after);
        this.filter.Q.setValueAtTime(this.bandwidth, audioCtx.currentTime + after);
        this.gainNode.gain.setValueAtTime(
            this.baseVolume * this.relativeVolume, audioCtx.currentTime + after);
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
        // if (!this._init) {
        this.oscillator.start();
        //     this._init = true;
        // }
    }
    start() {
        // console.log("starting oscillator "+ this.relativeVolume);
        this._on = true;
        this.gainNode.gain.setValueAtTime(
            this.baseVolume * this.relativeVolume, audioCtx.currentTime);
    }

    stop(after=0) {
        this.gainNode.gain.setValueAtTime(0, audioCtx.currentTime + after);
        this._on = false;
    }
}


type Vowel = { F1: number, F2: number, F3?: number };
export const formants = [new Formant(1), new Formant(0.6), new Formant(0.25)];
(window as any).formants = formants;

let _init = false;
function init() {
    if(_init == false) {
        formants.forEach(f => f.init());
        _init = true;
    }
}
(window as any).init = init;
export function startVowel(vowel: Vowel) {
    const f1 = vowel.F1;
    const f2 = vowel.F2;
    formants[0].value = f1;
    formants[1].value = f2;
    init();
    formants.forEach(f => f.start());
    // setTimeout(() => {
    //   formants.forEach(f => f.stop());
    // }, 1500);
}
export function changeVowel(vowel: Vowel) {
    const f1 = vowel.F1;
    const f2 = vowel.F2;
    formants[0].value = f1;
    formants[1].value = f2;
}
// (window as any).playVowel = playVowel;

export function stopVowel() {
    formants.forEach(f => f.stop());
}

export abstract class VowelScheduler {
    abstract start(): void;
    abstract stop(): void;
    abstract play(): void;
}
export class MonophthongScheduler extends VowelScheduler {
    vowel: Vowel;
    duration: number;
    constructor(vowel: Vowel, duration=1500) {
        super();
        this.vowel = vowel;
        this.duration = duration;
    }
    start() {
        startVowel(this.vowel);
    }
    stop() {
        stopVowel();
    }
    play() {
        init();
        this.start();
        setTimeout(() => {
            this.stop();
        }, this.duration);
    }
}
export class DiphthongScheduler extends VowelScheduler {
    startV: Vowel;
    endV: Vowel;
    duration=1500;
    steps=10;
    f1step: number;
    f2step: number;
    /**
     * 
     * @param startVowel 
     * @param endVowel 
     * @param duration in s
     * @param steps 
     */
    constructor(startVowel: Vowel, endVowel: Vowel, duration = 0.9, steps=10) {
        super();
        this.startV = startVowel;
        this.endV = endVowel;
        this.f1step = (endVowel.F1 - startVowel.F1) / steps;
        this.f2step = (endVowel.F2 - startVowel.F2) / steps;
        this.steps = steps;
        this.duration = duration;
        
    }
    start() {
        
    }
    stop() {
        stopVowel();
    }
    play() {
        init();
        const f1 = this.startV.F1;
        const f2 = this.startV.F2;

        formants[0].value = f1;
        formants[1].value = f2;

        let duration = this.duration;
        for(let i = 0; i < this.steps; i++) {
            // linear interpolation
            console.log(i * duration / this.steps);
            formants[0].schedule(f1 + i * this.f1step, i * duration / this.steps);
            formants[1].schedule(f2 + i * this.f2step, i * duration / this.steps);
        }
        formants.forEach(f => f.stop(duration));
        formants.forEach(f => f.start());

    }

}
export function schedule(start: Vowel, end?: Vowel): VowelScheduler {
    if(end) {
        return new DiphthongScheduler(start, end);
    }
    return new MonophthongScheduler(start);

}