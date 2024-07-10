import { trigger, state, animate, transition, style, animation, useAnimation } from '@angular/animations';
import { slideDownAnimation } from './animation-meta/slide-down';
import { slideUpAnimation } from './animation-meta/slide-up';

// useAnimation(slideAnimation)
export const slideAnimationTrigger = trigger('slideAnimation', [
    state(
        'open',
        style({ height: "*", overflow: 'visible' })
    ),
    state(
        'close',
        style({ height: '0', overflow: 'hidden' })
    ),
    transition(
        'close=>open', [
            animate(
                '200ms'
            )
        ]
    ),
    transition(
        'open=>close', [
            animate(
                '200ms'
            )
        ]), 
    transition(
        ':enter', [
            animate(
                '200ms'
            )
        ]
    ),
    transition(
        ':leave', [
            animate(
                '200ms'
            )
        ])
])
//export 