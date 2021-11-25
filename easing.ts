namespace easing {
    export enum RepeatMode {
        None = 0,
        Reverse = 1,
        Restart = 2
    }

    // Curve formulas from https://easings.net/
    // Only "ease in" curves appear here. "ease out" and "ease in-out" are derived programmatically from these.
    export function sine(t: number): number {
        return 1 - Math.cos((t * Math.PI) / 2);
    }
    export function sq1(t: number): number {
        return t;
    }
    export function sq2(t: number): number {
        return t * t;
    }
    export function sq3(t: number): number {
        return t * t * t;
    }
    export function sq4(t: number): number {
        return t * t * t * t;
    }
    export function sq5(t: number): number {
        return t * t * t * t * t;
    }
    export function expo(t: number): number {
        return t === 0 ? 0 : Math.pow(2, 10 * t - 10);
    }
    export function circ(t: number): number {
        return 1.0 - Math.sqrt(1.0 - Math.pow(t, 2));
    }
    export function back(t: number): number {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return c3 * t * t * t - c1 * t * t;
    }
    export function elastic(t: number): number {
        const c4 = (2 * Math.PI) / 3;
        return t === 0
            ? 0
            : t === 1
                ? 1
                : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
    }

    export function lerp(a: number, b: number, t: number): number {
        return a + (b - a) * t;
    }
    export function flip(t: number): number {
        return 1 - t;
    }

    // Choose an ease type and curve pair, like: `ease.easeIn(easing.sine)`
    export function linear(): (a: number, b: number, t: number) => number {
        return lerp;
    }
    export function snap(pct: number): (a: number, b: number, t: number) => number {
        return (a, b, t) => {
            return t < pct ? a : b;
        }
    }
    export function easeIn(fn: (t: number) => number): (a: number, b: number, t: number) => number {
        return (a, b, t) => lerp(a, b, fn(t));
    }
    export function easeOut(fn: (t: number) => number): (a: number, b: number, t: number) => number {
        return (a, b, t) => lerp(a, b, flip(fn(flip(t))));
    }
    export function easeInOut(fn: (t: number) => number): (a: number, b: number, t: number) => number {
        return (a, b, t) => {
            t = lerp(fn(t), flip(fn(flip(t))), t);
            return lerp(a, b, t);
        }
    }

    let interpolations: {
        [name: string]: Interpolation;
    } = {};

    class Interpolation {
        private startMs: number;
        private deltaValue: number;
        private reverse: boolean;

        constructor(
            private name: string,
            private startValue: number,
            private endValue: number,
            private durationMs: number,
            private curve: (a: number, b: number, t: number) => number,
            private callback: (v: number) => void,
            private repeatMode: RepeatMode,
            private onEnd?: (name: string) => void
        ) {
            this.onEnd = onEnd || (() => { });
            this.deltaValue = this.endValue - this.startValue;
            this.startMs = control.millis();
            this.reverse = false;
        }

        public update() {
            const currMs = control.millis();
            const deltaMs = currMs - this.startMs;
            if (deltaMs >= this.durationMs) {
                // Final callback for end value
                this.step(1);
                switch (this.repeatMode) {
                    case RepeatMode.None: {
                        delete interpolations[this.name];
                        this.onEnd(this.name);
                        break;
                    }
                    case RepeatMode.Reverse: {
                        this.startMs = currMs;
                        this.reverse = !this.reverse;
                        break;
                    }
                    case RepeatMode.Restart: {
                        this.startMs = currMs;
                        break;
                    }
                }
            } else {
                const pctMs = deltaMs / this.durationMs;
                this.step(pctMs);
            }
        }

        public onComplete(callback: () => void) {
            this.onEnd = callback;
        }

        private step(t: number) {
            if (this.reverse) {
                t = 1 - t;
            }
            this.callback(this.curve(this.startValue, this.endValue, t));
        }
    }

    export function interpolate(
        name: string,
        startValue: number,
        endValue: number,
        durationMs: number,
        curve: (a: number, b: number, t: number) => number,
        callback: (v: number) => void,
        repeatMode: RepeatMode,
        onEnd?: (name: string) => void
    ): void {
        if (interpolations[name]) return;
        const anim = new Interpolation(name, startValue, endValue, durationMs, curve, callback, repeatMode, onEnd);
        interpolations[name] = anim;
    }

    export function cancel(name: string): void {
        delete interpolations[name];
    }

    export function exists(name: string): boolean {
        return !!interpolations[name];
    }

    export function onComplete(name: string, callback: () => void): void {
        if (interpolations[name]) {
            interpolations[name].onComplete(callback);
        }
    }

    game.onUpdate(() => {
        const animNames = Object.keys(interpolations);
        for (const name of animNames) {
            const anim = interpolations[name];
            anim.update();
        }
    });
}

//% block="Interpolation" color="#0084c9"
namespace easing.blocks {
    export enum CurveType {
        None, Sine, Sq1, Sq2, Sq3, Sq4, Sq5, Expo, Circ, Back, Elastic
    }
    export enum EaseType {
        Linear, EaseIn, EaseOut, EaseInOut
    }

    /**
     * Interpolate from start value to end value over the specified ease curve.
     */
    //% blockId=ease_curve_interpolate
    //% block="$name: interpolate $value from $startValue to $endValue for $durationMs (ms) with curve $curveType and easing $easeType repeat $repeatMode"
    //% draggableParameters="reporter"
    //% name.defl="my anim"
    //% endValue.defl=1
    //% durationMs.defl=1000
    //% handlerStatement=1
    //% inlineInputMode=external
    export function interpolate(
        name: string,
        startValue: number,
        endValue: number,
        durationMs: number,
        curveType: CurveType,
        easeType: EaseType,
        repeatMode: easing.RepeatMode,
        callback: (value: number) => void
    ): void {
        if (easing.exists(name)) return;
        let curveMethod: (t: number) => number;
        let easeMethod: (a: number, b: number, t: number) => number;
        switch (curveType) {
            case CurveType.Sine: curveMethod = easing.sine; break;
            case CurveType.Sq1: curveMethod = easing.sq1; break;
            case CurveType.Sq2: curveMethod = easing.sq2; break;
            case CurveType.Sq3: curveMethod = easing.sq3; break;
            case CurveType.Sq4: curveMethod = easing.sq4; break;
            case CurveType.Sq5: curveMethod = easing.sq5; break;
            case CurveType.Expo: curveMethod = easing.expo; break;
            case CurveType.Circ: curveMethod = easing.circ; break;
            case CurveType.Back: curveMethod = easing.back; break;
            case CurveType.Elastic: curveMethod = easing.elastic; break;
        }
        switch (easeType) {
            case EaseType.Linear: easeMethod = easing.linear(); break;
            case EaseType.EaseIn: easeMethod = easing.easeIn(curveMethod); break;
            case EaseType.EaseOut: easeMethod = easing.easeOut(curveMethod); break;
            case EaseType.EaseInOut: easeMethod = easing.easeInOut(curveMethod); break;
        }
        easing.interpolate(
            name,
            startValue,
            endValue,
            durationMs,
            easeMethod,
            callback,
            repeatMode);
    }

    //% blockId=ease_curve_cancel
    //% block="$name: cancel"
    //% name.defl="my anim"
    export function cancel(name: string): void {
        easing.cancel(name);
    }

    //% blockId=ease_curve_on_complete
    //% block="$name: on complete"
    //% name.defl="my anim"
    export function onComplete(name: string, callback: () => void): void {
        easing.onComplete(name, callback);
    }
}
