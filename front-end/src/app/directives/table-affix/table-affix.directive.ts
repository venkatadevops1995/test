import { DOCUMENT } from '@angular/common';
import { Directive, ElementRef, Inject, Input, Renderer2, SimpleChanges } from '@angular/core';
import { MatSort, Sort, SortDirection } from '@angular/material/sort';
import { fromEvent, Subject, takeUntil } from 'rxjs';
import { SingletonService } from 'src/app/services/singleton.service';
import { WindowReferenceService } from 'src/app/services/window-reference.service';

interface tableAffix {
  disable?: boolean,
  scrollX?: number,
  // this is for the (this.el) of table p is for parent of the current parent (this.el)
  affixReference?: 'default' | 'p' | 'p.p' | 'p.p.p' | 'this',
  sort?: MatSort
}

@Directive({
  selector: '[tableAffix]'
})
export class TableAffixDirective {

  // declare the property of the directive to access the input value 
  @Input() tableAffix: tableAffix;

  defaultSettings: tableAffix = {
    disable: false,
    scrollX: 0,
    affixReference: 'default',
    sort: null
  }

  settings: tableAffix = { ...this.defaultSettings }

  destroy$: Subject<any> = new Subject();

  // the mutation observer of for auto update
  observer: MutationObserver;

  clone: HTMLElement;

  wrapperTable: HTMLTableElement;

  wrapperDiv: HTMLElement;

  originalTable: HTMLElement;

  // in case the table headers have sorting we need to keep track of the sorting which is active
  currentSortId: any = null

  currentSortHeader: any = null

  currentSortDirection: SortDirection = "";

  handleSortChangeEvent: boolean = true;


  directionExpansion = {
    asc: 'ascending',
    desc: 'descending',
  }

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    private windowRef: WindowReferenceService,
    @Inject(DOCUMENT) private doc: Document,
    private ss: SingletonService) { }


  ngOnChanges(values: SimpleChanges) {
    if (values.tableAffix && (values.tableAffix.currentValue != values.tableAffix.previousValue)) {
      this.settings = Object.assign(this.defaultSettings, this.tableAffix)
      if (this.settings.sort) {
        this.settings.sort.sortChange.pipe(takeUntil(this.destroy$)).subscribe((val: Sort) => {
          if (val.active == null) {
            if (this.currentSortHeader) {
              this.currentSortHeader.setAttribute('aria-sort', 'none')
            }
          } else {
            this.currentSortHeader = this.wrapperDiv.querySelector('[sort-id="' + val.active + '"]')
            this.currentSortHeader.setAttribute('aria-sort', val.direction ? this.directionExpansion[val.direction] : 'none')
          }
          this.currentSortId = val.active;
          this.currentSortDirection = val.direction;
        })
      }
    }
  }


  setCloneTableWidth() {
    // for each table header cell set the width of the table header cell in the clone 
    let width = getComputedStyle(this.el.nativeElement).width;
    this.wrapperDiv.style.width = width
    this.renderer.setStyle(this.wrapperDiv, 'width', width)
    let originalWidth = this.originalTable.getBoundingClientRect().width; 
    this.wrapperTable.style.width = originalWidth + 'px';
    // console.log(originalWidth,width)
  }

  ngAfterViewInit() { 
      this.ss.sideBarToggle$.pipe(takeUntil(this.destroy$)).subscribe((val) => {
        setTimeout(() => { 
          this.setCloneTableWidth()
        }, 450)
      })

      this.wrapperDiv = document.createElement('div');
      this.wrapperTable = document.createElement('table');
      let targetNode = this.el.nativeElement.querySelector('thead');
      this.originalTable = this.el.nativeElement.querySelector('table');
      this.wrapperTable.appendChild(targetNode.cloneNode(true));
      let originalThs = Array.from(this.originalTable.querySelectorAll('th'));
      this.wrapperTable.insertAdjacentHTML('afterbegin', "<colgroup></colgroup>");
      let colGroup = this.wrapperTable.querySelector('colgroup');

      Array.from(this.wrapperTable.querySelectorAll('th')).forEach((thItem: any, index) => {
        let width = getComputedStyle(originalThs[index]).width;
        let col = document.createElement('col')
        colGroup.appendChild(col)
        col.setAttribute('width', parseInt(width, 10) + "")
      });

      this.wrapperDiv.appendChild(this.wrapperTable);

      this.setCloneTableWidth()

      this.renderer.insertBefore(this.el.nativeElement.parentNode, this.wrapperDiv, this.el.nativeElement);

      this.wrapperDiv.style.display = 'none';

      this.wrapperDiv.style.overflowX = 'hidden'

      fromEvent(this.wrapperDiv, 'click').pipe(takeUntil(this.destroy$)).subscribe((e) => {
        if (this.settings.sort) {
          this.handleSortChangeEvent = false;
          // console.log(e)
          let target = <HTMLElement>e.target;
          let tempTarget: HTMLElement = target;
          while (tempTarget != this.wrapperDiv) {
            if (tempTarget.classList.contains('mat-sort-header')) {
              let id = tempTarget.getAttribute('sort-id');
              if (this.settings.sort.active != id) {
                this.settings.sort.sort({ start: 'asc', disableClear: false, id: id });
              } else {
                let matSortDirection: any = this.settings.sort.getNextSortDirection({ start: <any>this.currentSortDirection, disableClear: false, id: id });
                if (this.currentSortDirection == 'desc') {
                  matSortDirection = "";
                  this.settings.sort.sort({ id: null, start: 'desc', disableClear: false });
                } else {
                  this.settings.sort.sort({ start: <any>this.currentSortDirection, disableClear: false, id: id });
                }
              }
              if (this.settings.affixReference == 'this') {
                this.el.nativeElement.scrollTop = 0;
              }
            }
            tempTarget = tempTarget.parentElement
          }
        }
      })

      fromEvent(this.el.nativeElement, 'scroll').pipe(takeUntil(this.destroy$)).subscribe(e => {
        // console.log('scrolling')
        this.wrapperDiv.scrollLeft = this.el.nativeElement.scrollLeft;
        // if the table implementation is having a scroller of its own and needs to have the header to be affixed wrt the scrolling element
        if (this.settings.affixReference == 'this') {
          let reference = this.el.nativeElement;
          let referenceRect = reference.getBoundingClientRect();
          let originalTableThead = this.originalTable.querySelector('thead')
          let originalTableHeadRect = originalTableThead.getBoundingClientRect();
          if (reference.scrollTop > originalTableHeadRect.height && reference.scrollTop <= (reference.scrollHeight - referenceRect.height)) {
            this.wrapperDiv.classList.add('affix-target');
            originalTableThead.style.visibility = 'hidden'
            this.wrapperDiv.style.top = referenceRect.top + 'px'
            this.wrapperDiv.style.display = this.el.nativeElement.style.display
          } else {
            this.wrapperDiv.classList.remove('affix-target');
            originalTableThead.style.visibility = 'visible'
            this.wrapperDiv.style.display = 'none'
          }
        }
      });

      fromEvent(this.windowRef.nativeWindow, 'scroll').pipe(takeUntil(this.destroy$)).subscribe((e: Event) => {

        let reference = this.originalTable;

        let target = (<HTMLElement>this.wrapperTable.querySelector('thead'));

        let targetRect = target.getBoundingClientRect();

        let referenceRect = reference.getBoundingClientRect();

        let width = getComputedStyle(this.el.nativeElement).width;

        this.wrapperDiv.style.width = width;

        if (this.settings.affixReference == 'default') {
          if (referenceRect.top < 0 && (referenceRect.bottom - targetRect.height) > 0) {
            this.wrapperDiv.classList.add('affix-target');
            this.wrapperDiv.style.display = reference.style.display;
          } else {
            this.wrapperDiv.classList.remove('affix-target')
            this.wrapperDiv.style.display = 'none'
          }
        } else if (this.settings.affixReference == 'this') {
          let el = this.el.nativeElement
          let elRect = el.getBoundingClientRect();
          // console.log(document.documentElement.scrollTop, elRect.top)
          this.wrapperDiv.style.top = elRect.top + 'px'
        }

      }) 

  }

  ngOnDestroy() {
    this.destroy$.next(null)
    this.destroy$.complete();
  }


}
