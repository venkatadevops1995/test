import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { LeaveHistoryModule } from '../leave-history/leave-history.module';
import { MatTableDataSource } from '@angular/material/table';
import {MatSort} from '@angular/material/sort';
@Component({
  selector: 'app-show-table',
  templateUrl: './show-table.component.html',
  styleUrls: ['./show-table.component.scss']
})
export class ShowTableComponent implements OnInit {

  constructor(private datepipe : DatePipe) { }

  ngOnInit(): void {
  }
  @Input() LEAVE_DATA_HISTORY : any;
  
  @ViewChild(MatSort) sort: MatSort;
  ngAfterViewInit() {
    setTimeout(()=>{
      this.LEAVE_DATA_HISTORY = new MatTableDataSource(this.LEAVE_DATA_HISTORY);
      this.LEAVE_DATA_HISTORY.sort = this.sort;
    })
  }
  leaveApplicationColumns: string[] = ['serial', 'id', 'emp_name', 'startdate', 'enddate', 'day_count', 'leave_type', 'status'];
  convertDatefmt(date) {
    return this.datepipe.transform(date, 'yyyy-MM-dd');
  }

}
