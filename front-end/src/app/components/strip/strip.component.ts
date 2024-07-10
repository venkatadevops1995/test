import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-strip',
  templateUrl: './strip.component.html',
  styleUrls: ['./strip.component.scss']
})
export class StripComponent implements OnInit {

  @Input() data: { left: string, right: string | number  };

  constructor() { }

  ngOnInit(): void {
  }

}
