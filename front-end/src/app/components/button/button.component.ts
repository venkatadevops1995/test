import { Component, OnInit, Input, HostBinding, ElementRef, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-button',
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss'],
  encapsulation:ViewEncapsulation.None
})
export class ButtonComponent implements OnInit {

  @Input() id: string;

  @Input() type: 'button' | 'submit' = 'submit';

  @Input() size: 'default' | 'small' | 'extra-small' = 'default';

  @Input() disabled: boolean = false;

  @Input() theme: "default" | "grey" | "blue-lite" | "black" | "blue-lite-extra" | "success" | "danger" | 'red';

  colors: { start: any, stop: any } = { start: 'var(--col-accent-500)', stop: 'rgba(19, 155, 72, 0.1)' }

  gradientUrls: { stroke?: any, fill?: any } = {}

  // bind the disabled state with class empty
  @HostBinding('class.disabled') get isDisabled() { return this.disabled; };

  constructor(private el: ElementRef) { }

  ngOnInit(): void {
    if (this.theme == 'grey') {
      this.colors.start = 'var(--col-primary-300)';
      this.colors.stop = 'rgba(128,128,128,0.2)';
    }else if(this.theme == 'red'){
      this.colors.start = 'var(--col-warn-500)';
      this.colors.stop = 'var(--col-warn-A200)';
    } 
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.id = this.el.nativeElement.getAttribute('id') || 'btn-' + Math.floor((Math.random() * 1000))
      this.gradientUrls.stroke = 'url(#linear-' + this.id + ')';
      this.gradientUrls.fill = 'url(#linear-vertical-' + this.id + ')';
    })
  }

}
