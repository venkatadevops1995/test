import { WindowReferenceService } from "./../../services/window-reference.service";
import { SingletonService } from "./../../services/singleton.service";
import {
  Directive,
  Input,
  ElementRef,
  HostBinding,
} from "@angular/core";
import { HttpClient } from "@angular/common/http";

@Directive({
  selector: "[svgIcon]"
})
export class SvgIconDirective {

  @Input() svgIcon: { url?: string, w?: number | string, h?: number | string };

  defaultUrls = ['./assets/images/icons-sprite-new.svg', './assets/images/icons-sprite.svg'];

  constructor(
    private element: ElementRef,
    private http: HttpClient,
    private ss: SingletonService,
    private windowRef: WindowReferenceService
  ) { }

  @HostBinding("style.lineHeight") lH = "0";

  getDefaultIcons() {
    this.defaultUrls.forEach((url) => {
      this.http.get(url, { responseType: "text" }).subscribe(res => {
        let svg = res;
        this.ss.svg.push(url);
        this.ss.svgComponent.el.nativeElement.insertAdjacentHTML(
          "beforeEnd",
          svg
        );
      });
    })
  }

  ngOnChanges(values) {
    var input = values.svgIcon.currentValue;

    var current;
    // if the input is of type object
    if (typeof input === "object") {
      current = values.svgIcon.currentValue.url;
    } else {
      current = input;
    }

    if (current === undefined || current === null) {
      return;
    }

    if (input.disIb !== undefined || input.disIb === false) {
    } else {
      this.element.nativeElement.classList.add("dis-ib");
      this.element.nativeElement.classList.add("pointer");
    }

    // get the svg symbol id from the url property in input
    let SvgUrl = current.split(".svg#")[0] + ".svg";
    var symbol = current.split(".svg#")[1];
    var index;

    if (this.ss.svg.indexOf(SvgUrl) === -1) {
      this.ss.svg.push(SvgUrl);
      // this.http.get(SvgUrl, { responseType: "text" }).subscribe(res => {
      //   let svg = res;
      //   index = this.ss.svg.indexOf(SvgUrl);
      //   this.ss.svgComponent.el.nativeElement.insertAdjacentHTML(
      //     "beforeEnd",
      //     svg
      //   );
      //   this.appendSVG(input, symbol);
      // });
    } else {
      var that_this = this;
      setTimeout(function () {
        if (document.getElementById(symbol)) {
          that_this.appendSVG(input, symbol);
        }
      }, 500);
    }

  }

  appendSVG(input, symbol) {
    let symbolSVG = this.ss.svgComponent.el.nativeElement.querySelector(
      "symbol#" + symbol
    );
    let vB = symbolSVG.getAttribute("viewBox");
    let vBSplit = vB ? vB.split(" ") : [0, 0, 0, 0];
    let svgNS = this.windowRef.nativeWindow.document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg"
    );

    // if viewBox is not available
    vB
      ? svgNS.setAttribute("viewBox", vB)
      : svgNS.setAttribute("viewBox", "0 0 10 10");

    // if the element to which the direct has properties assigned to it with prefix svg assign them to svg element 
    Array.prototype.slice
      .call(this.element.nativeElement.attributes)
      .forEach(function (item) {
        if (item.name.indexOf("svg-") > -1) {
          svgNS.setAttribute(item.name.replace("svg-", ""), item.value);
        }
      });

    // input object has key styles to set styles on svg
    if (input.styles) {
      input.styles.forEach(style => {
        svgNS.setAttribute(style.key, style.value);
      });
    }

    // if view box is available
    if (vB) {
      if (input.w && input.h) {
        svgNS.setAttribute("width", input.w);
        svgNS.setAttribute("height", input.h);
      } else if (input.w) {
        let proportionateHeight = (vBSplit[3] * input.w) / vBSplit[2];
        if (proportionateHeight) {
          svgNS.setAttribute("height", "" + proportionateHeight);
        }
        svgNS.setAttribute("width", input.w);
      } else if (input.h) {
        let proportionateWidth = (vBSplit[2] * input.h) / vBSplit[3];
        if (proportionateWidth) {
          svgNS.setAttribute("width", "" + proportionateWidth);
        }
        svgNS.setAttribute("height", input.h);
      }
    }

    let nodes = symbolSVG.childNodes;

    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].nodeName != "#text") {
        //console.log(nodes[i]);
        svgNS.appendChild(nodes[i].cloneNode(true));
      }
    }
    //let divNS = this.winObj.nativeWindow.document.createElement('div');
    //divNS.appendChild(svgNS);
    this.element.nativeElement.appendChild(svgNS);
  }

  ngOnInit() {
    //console.log(this.singleton.svg);
  }
}
