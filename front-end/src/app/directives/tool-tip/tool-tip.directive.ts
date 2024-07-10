import { ConnectionPositionPair, Overlay, OverlayPositionBuilder, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal, TemplatePortal } from '@angular/cdk/portal';
import { Directive, ElementRef, HostListener, Input, Renderer2, SimpleChange, SimpleChanges, TemplateRef, ViewContainerRef } from '@angular/core';
import { isDescendant } from 'src/app/functions/isDescendent.fn';
import { ToolTipCompComponent } from './tool-tip-comp/tool-tip-comp.component';

@Directive({
  selector: '[toolTip]'
})
export class ToolTipDirective {

  @Input() toolTip: TemplateRef<any> | string;

  overlayRef: OverlayRef;

  unlisten: Function

  // positions: Array<ConnectionPositionPair> = [
  //   new ConnectionPositionPair({ originX: 'center', originY: 'bottom' }, { overlayX: 'center', overlayY: 'top' }),
  //   new ConnectionPositionPair({ originX: 'center', originY: 'top' }, { overlayX: 'center', overlayY: 'bottom' }),
  //   new ConnectionPositionPair({ originX: 'end', originY: 'bottom' }, { overlayX: 'end', overlayY: 'top' }),
  //   new ConnectionPositionPair({ originX: 'end', originY: 'top' }, { overlayX: 'end', overlayY: 'bottom' }),
  // ]
  positions = [
    new ConnectionPositionPair({ originX: 'start', originY: 'bottom' }, { overlayX: 'start', overlayY: 'top' }),
    new ConnectionPositionPair({ originX: 'start', originY: 'top' }, { overlayX: 'start', overlayY: 'bottom' }),
    new ConnectionPositionPair({ originX: 'end', originY: 'bottom' }, { overlayX: 'end', overlayY: 'top' }),
    new ConnectionPositionPair({ originX: 'end', originY: 'top' }, { overlayX: 'end', overlayY: 'bottom' }),
  ]

  constructor(
    private overlay: Overlay, private viewContainerRef: ViewContainerRef,
    private positionBuilder: OverlayPositionBuilder,
    private elRef: ElementRef,
    private renderer: Renderer2) { }


  ngOnChanges(changes: SimpleChanges) {
    let toolTip: SimpleChange = changes['toolTip']
    // console.log('directive', this.toolTip, this.elRef)
    // if (toolTip.previousValue != toolTip.currentValue) {
    //   if (this.overlayRef) {

    //   } else {


    //   }
    // }
  }

  ngOnInit() {
    // this.unlisten = this.renderer.listen(document, 'mouseenter', this.onEnter)
  }




  @HostListener('mouseover', ['$event'])
  onEnter(e: MouseEvent) {
    let target = e.target;

    if (target == this.elRef.nativeElement || isDescendant(this.elRef.nativeElement, target)) {
      // console.log(e,this.toolTip)

      let positionStrategy = this.positionBuilder.flexibleConnectedTo(this.elRef)
        .withPositions(this.positions)
        .withFlexibleDimensions(false)
        .withPush(false);
         
      this.overlayRef = this.overlay.create({
        hasBackdrop: true,
        panelClass: ['atai-tool-tip'],
        positionStrategy: positionStrategy
      })
      // this.overlay.position().flexibleConnectedTo(this.elRef).withPositions
      if (this.toolTip instanceof TemplateRef) {
        let portalRef = new TemplatePortal(<TemplateRef<any>>this.toolTip, this.viewContainerRef)
        this.overlayRef.attach(portalRef)
      } else if (<any>this.toolTip instanceof String) {
        let portalRef = new ComponentPortal(ToolTipCompComponent )
        let compRef = this.overlayRef.attach(portalRef)
        compRef.instance.text = this.toolTip
      }

    }

  }
  @HostListener('mouseout', ['$event'])
  onLeave(e: MouseEvent) {
    let target = e.target;

    if (target == this.elRef.nativeElement) {
      // console.log(e)

      // this.overlayRef.dispose()
    }
  }

}
