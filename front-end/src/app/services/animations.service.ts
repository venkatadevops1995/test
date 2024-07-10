import { SingletonService } from './singleton.service';
import { slideUpAnimation } from './../animations/animation-meta/slide-up';
import { fadeOutUpAnimation } from './../animations/animation-meta/fade-out-up';
import { fadeInDownAnimation } from './../animations/animation-meta/fade-in-down';
import { slideDownAnimation } from './../animations/animation-meta/slide-down';
import { Injectable, Renderer2, RendererFactory2 } from "@angular/core";
import { style, keyframes, animate, AnimationBuilder, transition, query, useAnimation } from "@angular/animations";
@Injectable()
export class AnimationsService {

    constructor(
        private builder: AnimationBuilder,
        private ss: SingletonService
    ) {

    }

    public slideUp(element: any, duration: any = "200ms", callback?: Function, context = null) {
        const animation = this.builder.build([
            useAnimation(
                slideUpAnimation,
                {
                    params: { duration: duration }
                }
            )
        ]);
        let animationPlayer = animation.create(element);
        // console.log(element.style.width);
        animationPlayer.onDone(() => {
            // element.style.height = "0px";
            element.style.display = "none";
            if (callback) {
                callback.call(context);
            }
        })
        animationPlayer.play();
    }

    public slideDown(element: any, duration: any = "200ms", callback?: Function, context = null) {
        // temporary element to calculate the height of the element
        let x = element.cloneNode(true);
        x.style.display = "block";
        element.style.display = "";

        // console.log(element.clientWidth);
        x.style.position = 'absolute';
        x.style.opacity = 0;
        x.style.padding = 0;
        x.style.border = 'none';
        element.appendChild(x);
        // console.log(x.clientHeight);
        x.style.width = element.clientWidth + 'px';
        let heightToAnimate = x.scrollHeight;
        element.removeChild(x);
        const animation = this.builder.build([
            style({   display: "", overflow: "hidden" }),
            animate(
                duration, style({
                    'height': heightToAnimate,
                })
            ),
            style({ overflow: "visible" })
        ]);

        let animationPlayer = animation.create(element);
        animationPlayer.onDone(() => {
            element.style.height = "auto";
            if (callback) {
                callback.call(context);
            }
        })
        animationPlayer.play();
    }

    public fadeInDown(element: any, duration: any = "200ms", callback?: Function, context: any = null) {
        const animation = this.builder.build([
            useAnimation(
                fadeInDownAnimation,
                {
                    params: { duration: duration }
                }
            )
        ]);
        let animationPlayer = animation.create(element);
        element.style.display = "";
        animationPlayer.play();

        animationPlayer.onDone(() => {
            if (callback) {
                callback.call(context);
            }
            // this.ss.renderer.setStyle(element,'transform','none');
            // element.style.transform = "none";
            // console.log(element.style.transform);
        })
    }

    public fadeOutUp(element: any, duration = "200ms", callback?: Function, context: any = null) {
        const animation = this.builder.build([
            useAnimation(
                fadeOutUpAnimation,
                {
                    params: { duration: duration }
                }
            )
        ]);
        let animationPlayer = animation.create(element);
        animationPlayer.play();
        animationPlayer.onDone(() => {
            element.style.display = "none";
            if (callback) {
                callback.call(context);
            }
        })
    }
}