namespace ease.formula {
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
}

namespace ease.util {
    export function lerp(a: number, b: number, t: number): number {
        return a + (b - a) * t;
    }
    export function flip(t: number): number {
        return 1 - t;
    }
}

// Choose an ease type and curve pair, like: `ease.easeIn(ease.forumula.sine)`
namespace ease.curves {
    export function linear(): (a: number, b: number, t: number) => number {
        return util.lerp;
    }
    export function snap(pct: number): (a: number, b: number, t: number) => number {
        return (a, b, t) => {
            return t < pct ? a : b;
        }
    }
    export function easeIn(fn: (t: number) => number): (a: number, b: number, t: number) => number {
        return (a, b, t) => util.lerp(a, b, fn(t));
    }
    export function easeOut(fn: (t: number) => number): (a: number, b: number, t: number) => number {
        return (a, b, t) => util.lerp(a, b, util.flip(fn(util.flip(t))));
    }
    export function easeInOut(fn: (t: number) => number): (a: number, b: number, t: number) => number {
        return (a, b, t) => {
            t = util.lerp(fn(t), util.flip(fn(util.flip(t))), t);
            return util.lerp(a, b, t);
        }
    }
}

namespace ease.animation {
    let animations: {
        [name: string]: Animation;
    } = {};

    class Animation {
        private startMs: number;
        private deltaValue: number;
        public done: boolean;
        constructor(
            private name: string,
            private startValue: number,
            private endValue: number,
            private durationMs: number,
            private curve: (a: number, b: number, t: number) => number,
            private callback: (v: number) => void
        ) {
            this.deltaValue = this.endValue - this.startValue;
            this.startMs = control.millis();
        }

        public update() {
            const currMs = control.millis();
            const deltaMs = currMs - this.startMs;
            if (deltaMs >= this.durationMs) {
                // Final callback for end value
                this.callback(this.endValue);
                this.done = true;
            } else {
                const pctMs = deltaMs / this.durationMs;
                const v = this.curve(this.startValue, this.endValue, pctMs);
                this.callback(v);
            }
        }
    }

    export function animate(
        name: string,
        startValue: number,
        endValue: number,
        durationMs: number,
        curve: (a: number, b: number, t: number) => number,
        callback: (v: number) => void
    ): void {
        if (animations[name]) return;
        const anim = new Animation(name, startValue, endValue, durationMs, curve, callback);
        animations[name] = anim;
    }

    game.onUpdate(() => {
        const animNames = Object.keys(animations);
        for (const name of animNames) {
            const anim = animations[name];
            anim.update();
            if (anim.done) {
                delete animations[name];
            }
        }
    });
}
