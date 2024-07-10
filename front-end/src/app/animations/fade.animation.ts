import { trigger, state, animate, transition, style, animation } from '@angular/animations';

export const voidFadeToggle = trigger(
   'voidFadeToggle', [
      transition(':enter', [
         style({ 'opacity': '0', 'transform': 'translateY(-20px)' }),
         animate('300ms')
      ]),
      transition(':leave', [
         //style({ 'position': 'absolute'}),
         animate('300ms', style({ 'opacity': '0', 'transform': 'translateY(20px)' }))
      ])
   ]
);