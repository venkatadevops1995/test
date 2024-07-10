import { trigger, state, animate, transition, style, keyframes, useAnimation } from '@angular/animations';
import { fadeInDownAnimation } from './../animations/animation-meta/fade-in-down';

export const routerAnimationTrigger =  
    trigger('routerAnimation', [
        // route 'enter' transition
        transition(':enter', [
            useAnimation(fadeInDownAnimation, { params: {duration:"200ms"} })
        ]),
    ]);