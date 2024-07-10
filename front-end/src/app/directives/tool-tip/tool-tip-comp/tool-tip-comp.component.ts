import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-tool-tip-comp',
  templateUrl: './tool-tip-comp.component.html',
  styleUrls: ['./tool-tip-comp.component.scss']
})
export class ToolTipCompComponent implements OnInit {

  text:string = ""

  constructor() { }

  ngOnInit(): void {
  }

}
