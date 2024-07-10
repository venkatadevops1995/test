import { query } from '@angular/animations';
import { trigger, state, animate, transition, style, animation, useAnimation, keyframes } from '@angular/animations';

export const fadeInDownAnimation = animation([
    animate(
        '{{duration}}',
        keyframes([
            style({
                'display':'',
                'opacity': 0, 
                'transform': 'translateY({{distance}})',
                offset: 0
            }),
            style({
                'opacity': 0, 
                'transform': 'translateY({{distance}})',
                offset: 0.25
            }),
            style({
                'opacity': 1, 
                'transform': 'translateY(0px)',
                offset: 0.99
            }),
            style({
                'opacity': 1, 
                'transform': 'none',
                offset: 1
            })
        ])
    )
], {
        params: {
            duration: "200ms",
            distance:"-10px"
        }
    });
