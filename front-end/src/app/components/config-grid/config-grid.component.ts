import { Component, Input, OnInit, Output } from '@angular/core';
import { EventEmitter } from 'events';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-config-grid',
  templateUrl: './config-grid.component.html',
  styleUrls: ['./config-grid.component.scss']
})
export class ConfigGridComponent implements OnInit {

  // input of the vertical header
  @Input() headersLeft: Array<any> = [];

  // input of the horizontal header
  @Input() headersTop: Array<any> = [];

  // communication channel using rxjs subject to emit different signals
  event$: Subject<{ signal: 'save-single', 'save-all', 'cancel-edit-single', 'cancel-edit-all', 'edit-single', data: any }> = new Subject();

  // out put event emitter
  @Output('event') eventEmit: EventEmitter = new EventEmitter();


  constructor() { }


  // 
  ngOnInit(): void {
  }

}
