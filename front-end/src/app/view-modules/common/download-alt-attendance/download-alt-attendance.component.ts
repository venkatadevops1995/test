import { Component, OnInit, ViewChild } from '@angular/core';
import { DatePipe, formatDate } from '@angular/common';
import { AtaiDateRangeComponent } from 'src/app/components/atai-date-range/atai-date-range.component';
import { BreakpointObserver } from '@angular/cdk/layout';
import { AtaiBreakPoints } from 'src/app/constants/atai-breakpoints';
import { SingletonService } from 'src/app/services/singleton.service';
@Component({
  selector: 'app-download-alt-attendance',
  templateUrl: './download-alt-attendance.component.html',
  styleUrls: ['./download-alt-attendance.component.scss']
})
export class DownloadAltAttendanceComponent implements OnInit {

  today = new Date()
  fromdate: any;
  todate: any;
  minDate = new Date(this.today.getTime() - (365 * 2 * 86400000))
  get Is_match() {
    return this.ss.responsive.isMatched([AtaiBreakPoints.XS, AtaiBreakPoints.SM])
  }

  @ViewChild(AtaiDateRangeComponent) dateRangePicker: AtaiDateRangeComponent;
  constructor(public datepipe: DatePipe, private ss: SingletonService) {
  }

  ngOnInit(): void {
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.setThisMonth()
    })
  }

  setThisMonth() {
    if (this.dateRangePicker) {
      this.dateRangePicker.setPresetValue('This Month')
    }
  }

  onDateSelect(date) {
    
    this.fromdate = this.convertDatefmt(date.start)
    this.todate = this.convertDatefmt(date.end)
  }

  convertDatefmt(date) {
    return this.datepipe.transform(date, 'yyyy-MM-dd');
  }


}
