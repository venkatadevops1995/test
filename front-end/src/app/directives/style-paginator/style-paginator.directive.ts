import { Directive, ElementRef } from '@angular/core';

@Directive({
  selector: '[appStylePaginator]'
})
export class StylePaginatorDirective {

  constructor(
    private el: ElementRef
  ) { }


  ngAfterViewInit() {
    // console.log(this.el)

    // move the range and actions (page select) before the page size
    let rangeActionsElementRef  = <HTMLElement>this.el.nativeElement.querySelector('.mat-paginator-range-actions')
    let pageSizeSelector =this.el.nativeElement.querySelector('.mat-paginator-page-size')
    let parentElement = pageSizeSelector.parentElement;
    parentElement.insertBefore(rangeActionsElementRef,pageSizeSelector)

    // move the previous button before the range text eg:(1-5 of 50 )
    let prevButton = <HTMLElement>this.el.nativeElement.querySelector('.mat-paginator-navigation-previous')
    let rangeText = this.el.nativeElement.querySelector('.mat-paginator-range-label')
    rangeActionsElementRef.insertBefore(prevButton,rangeText)

    // console.log(rangeActionsElementRef,pageSizeSelector)
  } 
}
