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
        this.filter.frequency.setTargetAtTime(value, audioCtx.currentTime, 0.015);
    }
    schedule(value: number, after: number) {
        this.filter.frequency.setTargetAtTime(value, audioCtx.currentTime + after, 0.015);
        this.gainNode.gain.setTargetAtTime(
            this.baseVolume * this.relativeVolume, audioCtx.currentTime + after, 0.015);
    }
    constructor(relativeVolume: number = 1) {
        const oscillator = audioCtx.createOscillator();
        this.oscillator = oscillator;
        oscillator.type = "sawtooth"; // "square";
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
        this._on = true;
        this.gainNode.gain.setTargetAtTime(
            this.baseVolume * this.relativeVolume, audioCtx.currentTime, 0.03);
    }

    stop(after=0) {
        this.gainNode.gain.setTargetAtTime(0, audioCtx.currentTime + after, 0.015);
        this.filter.frequency.cancelScheduledValues(audioCtx.currentTime + after);
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
        // formants[2].filter.frequency.setValueAtTime(2650, audioCtx.currentTime);
        _init = true;
    }
}
(window as any).init = init;
export function startVowel(vowel: Vowel) {
    const f1 = vowel.F1;
    const f2 = vowel.F2;
    formants[0].value = f1;
    formants[1].value = f2;
    if(vowel.F3) {
        formants[2].value = vowel.F3;
    }
    init();
    formants.forEach(f => f.start());
}
export function changeVowel(vowel: Vowel) {
    const f1 = vowel.F1;
    const f2 = vowel.F2;
    formants[0].value = f1;
    formants[1].value = f2;
    if (vowel.F3) {
        formants[2].value = vowel.F3;
    }
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
    duration=0.6;
    holdDuration=0.15;
    /**
     * 
     * @param startVowel 
     * @param endVowel 
     * @param duration in s
     * @param steps 
     */
    constructor(startVowel: Vowel, endVowel: Vowel, duration = 0.6, hold_duration=0.10) {
        super();
        this.startV = startVowel;
        this.endV = endVowel;

        this.duration = duration;
        this.holdDuration = hold_duration;
        
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
        formants[0].filter.frequency.setTargetAtTime(f1, audioCtx.currentTime, 0.015);
        formants[1].filter.frequency.setTargetAtTime(f2, audioCtx.currentTime, 0.015);
        // linear ramp
        // formants[0].filter.frequency.linearRampToValueAtTime(this.endV.F1, audioCtx.currentTime + duration);
        // formants[1].filter.frequency.linearRampToValueAtTime(this.endV.F2, audioCtx.currentTime + duration);
        // if(this.endV.F3) {
        //     formants[2].oscillator.frequency.linearRampToValueAtTime(this.endV.F3, audioCtx.currentTime + duration);
        // }
        // // hold
        // formants[0].schedule(this.endV.F1, duration);
        // formants[1].schedule(this.endV.F2, duration);
        // formants[2].schedule(this.endV.F3, duration);

        // logistics curve
        // const f1steps = logisticsInterpSteps(f1, this.endV.F1, this.steps);
        // const f2steps = logisticsInterpSteps(f2, this.endV.F2, this.steps);
        // const f3steps = this.f3step ? logisticsInterpSteps(this.startV.F3!, this.endV.F3!, this.steps) : undefined;

        const f1steps = logisticsValues20.map(v => f1 + v * (this.endV.F1 - this.startV.F1));
        const f2steps = logisticsValues20.map(v => f2 + v * (this.endV.F2 - this.startV.F2));
        let f3steps = undefined;
        if(this.startV.F3 && this.endV.F3) {
            f3steps = logisticsValues20.map(v => this.startV.F3! + v * (this.endV.F3! - this.startV.F3!));
        }

        formants[0].filter.frequency.setValueCurveAtTime(f1steps, audioCtx.currentTime, duration);
        formants[1].filter.frequency.setValueCurveAtTime(f2steps, audioCtx.currentTime, duration);
        if(f3steps) {
            formants[2].filter.frequency.setValueCurveAtTime(f3steps, audioCtx.currentTime, duration);
        }
        // hold duration required?
        formants.forEach(f => f.stop(duration + this.holdDuration));
        formants.forEach(f => f.start());

    }

}
const logisticsFunc = (x: number) => 1 / (1 + Math.exp(-x));
function logisticsInterp(start: number, end: number) {
    // where x is between 0 and 1
    // use logistics curve from -6 to 6
    return (x: number) => {
        return start + (end - start) * logisticsFunc(x * 12 - 6);
    }
}
function logisticsInterpSteps(start: number, end: number, steps: number) : Float32Array {
    const interp = logisticsInterp(start, end);
    const step = 1 / steps;
    // take range from [0, 1] and divide into steps
    const arr = new Float32Array(steps);
    for(let i = 0; i < steps; i++) {
        arr[i] = interp(i * step);
    }
    return arr;
}
const logisticsValues20 = logisticsInterpSteps(0, 1, 23).slice(2, 22);

export function scheduler(start: Vowel, end?: Vowel): VowelScheduler {
    if(end) {
        return new DiphthongScheduler(start, end);
    }
    return new MonophthongScheduler(start);

}