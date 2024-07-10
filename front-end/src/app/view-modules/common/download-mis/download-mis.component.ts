import { Component, OnInit, ViewChild } from '@angular/core';
import { DatePipe, formatDate } from '@angular/common'; 
import { AtaiDateRangeComponent } from 'src/app/components/atai-date-range/atai-date-range.component';
import { BreakpointObserver } from '@angular/cdk/layout';
import { AtaiBreakPoints } from 'src/app/constants/atai-breakpoints';
import { SingletonService } from 'src/app/services/singleton.service';
// import { DaterangepickerDirective } from 'ngx-daterangepicker-material';


@Component({
  selector: 'app-download-mis',
  templateUrl: './download-mis.component.html',
  styleUrls: ['./download-mis.component.scss']
})
export class DownloadMisComponent implements OnInit {

  today = new Date()
  Ischecked: boolean = true;
  fromdate: any;
  downloadable = false;
  showMessage = false;
  date4;
  todate: any;
  // Is_match:boolean;
  minDate = new Date(this.today.getTime() - (365 * 2 * 86400000))
  selected: any = {};
  selectedEmpId: any;
  value: any;
  get Is_match(){
    return this.ss.responsive.isMatched([AtaiBreakPoints.XS,AtaiBreakPoints.SM])
  }

  @ViewChild(AtaiDateRangeComponent) dateRangePicker: AtaiDateRangeComponent;
  constructor(public datepipe: DatePipe,private ss:SingletonService) {
    // this.bp.observe([AtaiBreakPoints.XS,AtaiBreakPoints.SM]).subscribe(res=> {
    //     this.Is_match=res.matches;
    //     console.log('#########$@@@@@@@@@@ console for Is_match variable',this.Is_match);
    // })

   }

  ngOnInit(): void {
  }

  ngAfterViewInit() {
    // console.log('This month')
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
    this.selected["startDate"] = date.start;
    this.selected["endDate"] = date.end;
  }

  onIsDisableClick(event) {
    // console.log("Ischecked is ::::", event.checked);
    this.Ischecked = event.checked;
    if (event.checked) {
      // this.dateRangePicker.resetRange()
    } else {
      // this.setThisMonth()
    }
  }

  convertDatefmt(date) {
    return this.datepipe.transform(date, 'yyyy-MM-dd');
  }


}
