import { animation, style, animate } from '@angular/animations';
export const slideUpAnimation = animation([
    style({ height: "*", overflow: 'hidden' }),
    animate(
        '{{duration}}', style({
            height: "0px"
        })
    ),
    style({
        height: "0px"
    })
], {
        params: {
            duration: "200ms"
        }
    });