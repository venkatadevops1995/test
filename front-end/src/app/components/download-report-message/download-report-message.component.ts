import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-download-report-message',
  templateUrl: './download-report-message.component.html',
  styleUrls: ['./download-report-message.component.scss']
})
export class DownloadReportMessageComponent implements OnInit {

  @Input() message : string = ""

  constructor() { }

  ngOnInit(): void {
  }

}
