import { trigger, state, animate, transition, style, animation, query, animateChild, group } from '@angular/animations';

export const routerNewAnimation = trigger(
    'routerNewAnim', [
    transition('* <=> *', [
        style({ position: 'relative', opacity: 0 }),
        query(':enter, :leave', [
            style({
                opacity: 0
            })
        ]),
    ])
]
);