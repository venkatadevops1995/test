import { query } from '@angular/animations';
import { trigger, state, animate, transition, style, animation, useAnimation, keyframes } from '@angular/animations';

export const fadeOutUpAnimation = animation([
    animate(
        '{{duration}}',
        keyframes([
            style({
                'opacity': 1,
                '-webkit-transform': 'translateY(0px)',
                'transform': 'translateY(0px)',
                offset: 0
            }),
            style({
                'opacity': 1,
                '-webkit-transform': 'translateY(0px)',
                'transform': 'translateY(0px)',
                offset: 0.2
            }),
            style({
                'opacity': 0, 
                '-webkit-transform': 'translateY({{distance}})',
                'transform': 'translateY({{distance}})',
                offset: 1
            })
        ])
    )
], {
        params: {
            duration: "200ms",
            distance:"-20px"
        }
    });
