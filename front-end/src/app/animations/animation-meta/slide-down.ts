import { trigger, state, animate, transition, style, animation, useAnimation, keyframes } from '@angular/animations';

export const slideDownAnimation = animation([
    style({ height: "0px"}),
    animate(
        '{{duration}}', style({
            height:"*"
        })
    )
], {
        params: {
            duration: "200ms"
        }
    });