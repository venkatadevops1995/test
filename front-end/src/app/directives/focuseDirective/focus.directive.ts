import { AfterViewInit, Directive, ElementRef, HostBinding } from '@angular/core';

@Directive({
  selector: '[appFocus]'
})
export class FocusDirective implements AfterViewInit{
  @HostBinding('attr.tabIndex') index:number=0;
  constructor(private el:ElementRef) {
}
  ngAfterViewInit(): void {
    setTimeout(()=>{
      this.el.nativeElement.focus();
    },1000)
 
  }

}
