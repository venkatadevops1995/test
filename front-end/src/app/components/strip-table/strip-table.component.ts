import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-strip-table',
  templateUrl: './strip-table.component.html',
  styleUrls: ['./strip-table.component.scss']
})
export class StripTableComponent implements OnInit {

  // 
  @Input() data: Array<{ left: any, right: any }> = [];

  constructor() { }

  ngOnInit(): void {
    setTimeout(() => {
      // console.log(this.data)
    }, 1000)
  }

}
