import { ChangeDetectorRef, Component, HostBinding, Input, OnInit } from '@angular/core';

@Component({
  selector: 'svg.use-svg',
  templateUrl: './use-svg.component.html',
  styleUrls: ['./use-svg.component.scss']
})
export class UseSvgComponent implements OnInit {

  // the id of the symbol that is to be rendered
  @Input() symbol: string = "";

  // the id of the symbol that is to be rendered
  @Input() w: number | string = 15;

  // the id of the symbol that is to be rendered
  @Input() fill: string = "currentColor";

  // the id of the symbol that is to be rendered
  @Input() stroke: string = "";

  height: any = 15

  constructor(private cdRef: ChangeDetectorRef) { }

  ngOnInit(): void {
    let svg = document.querySelector('app-svg svg');
    if (svg) {
      let symbolSVG = svg.querySelector(
        "symbol#" + this.symbol
      );
      if (symbolSVG) {
        let vB = symbolSVG.getAttribute("viewBox");
        let vBSplit: any = vB ? vB.split(" ") : [0, 0, 0, 0];
        this.height = (vBSplit[3] * Number(this.w)) / vBSplit[2];
        this.cdRef.detectChanges()
      }
    }
  }

  @HostBinding('attr.width') get widthBind() {
    return this.w;
  }

  @HostBinding('attr.height') get heightBind() {
    return this.height;
  }


}
