import { AfterViewInit, Component, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { FormGroup, Validators, FormControl } from '@angular/forms';
import { SingletonService } from 'src/app/services/singleton.service';
import { HttpClientService } from 'src/app/services/http-client.service';
import { ReturnStatement } from '@angular/compiler';
import { UserService } from 'src/app/services/user.service';
import { ReplaySubject, Subject, Observable } from 'rxjs';
import { MatSelect } from '@angular/material/select';
import { takeUntil, take, startWith, map } from 'rxjs/operators';
import { CircleProgressComponent } from 'ng-circle-progress';
import { AtaiBreakPoints } from 'src/app/constants/atai-breakpoints';

export interface Leader {
  emp_id: any,
  emp_name: any;
}

@Component({
  selector: 'app-l2-dashboard',
  templateUrl: './l2-dashboard.component.html',
  styleUrls: ['./l2-dashboard.component.scss']
})
export class L2DashboardComponent implements OnInit {
  //fixing the circle-progress inside text
  // @ViewChildren('w-55') circleprogress:CircleProgressComponent;
  @ViewChildren('cp1') cp1: QueryList<CircleProgressComponent>;
  @ViewChildren('cp2') cp2: QueryList<CircleProgressComponent>;
  //week wise team data getting from api@#@
  weekWiseData: any = []

  // form group for search form
  fgSearch: FormGroup;

  //filter for Dashboard
  filterArray: Leader[] = [];
  massageShow:boolean=false;
  managerCtrl = new FormControl();

  filteredManagers: Observable<Leader[]>;

  value;

  //showing errors for wrong selection
  show: boolean = false;

  showMisDownload: boolean = false;

  get is_MD_LT(){
    return this.ss.responsiveState[AtaiBreakPoints.MD_LT];
  }
  constructor(
    private http: HttpClientService,
    private ss: SingletonService,
    private user: UserService
  ) {
    this.fgSearch = this.ss.fb.group({
      filtervalue: ["", [Validators.required]],
    }),
      this.filteredManagers = this.managerCtrl.valueChanges
        .pipe(
          startWith(''),
          map(state => state ? this.filterManagerList(state) : this.filterArray.slice())
        );
  }


  private filterManagerList(value: string): Leader[] {
    const filterValue = value.toLowerCase();


    return this.filterArray.filter(option => option.emp_name.toLowerCase().includes(filterValue))
    // return this.filterArray.filter(state => state.emp_name.toLowerCase().indexOf(filterValue) === 0);
  }


  ngOnInit(): void {
    this.getmanagerList();
    let emp_id = this.user.getEmpId();

  }

  // on load getting manager list under employees
  getmanagerList() {
    this.http.request("get", 'get-emp-mangers/').subscribe(res => {
      if (res.status == 200) {
        this.filterArray = res.body;
        //  this.states = res.body;
        let emp_id = this.user.getEmpId();

        this.filterArray.forEach(element => {
          if (element.emp_id == emp_id) {
            let emp_name = element.emp_name;
            this.managerCtrl.setValue(emp_name);
            this.onSubmitSearch(emp_name);
          } else if (element.emp_id == -1) {
            this.showMisDownload = true;
          }
        });
        console.log("showMisDownload", this.showMisDownload)
      }
    })
  }


  clear() {
    this.managerCtrl.reset();
    this.managerCtrl.setValue('');
  }


  // on submitting the search by filter form
  onSubmitSearch(value?) {
    let emp_id;
    this.filterArray.forEach(element => {
      if (element.emp_name == value) {
        emp_id = element.emp_id;
      }
    });
    if (emp_id) {
      this.http.request("get", 'get-historical-data/', 'emp_id=' + emp_id).subscribe((res) => {
        this.massageShow = true;
        if (res.status == 200) {
          this.weekWiseData = res.body;
        }
      })
    }
    else {
      this.ss.statusMessage.showStatusMessage(false, 'Select Leader form list')
    }
  }
  ngAfterViewInit() {
    setTimeout(() => {
      this.cp1.forEach(item => {
        item.svg.subtitle.y = 130;
      });
      this.cp2.forEach(el => {
        el.svg.subtitle.y = 130;
      });
    }, 3000)
  }
  //converting to percentage
  getPercentage(nccount, empcount) {
    let percentage: any = (nccount / empcount) * 100;
    percentage = Math.floor(parseInt(percentage))
    return parseInt(percentage);
  }


  //get week and emp_id
  getWeeks(index, emp_id) {
    return 'previousweek=' + index + '&emp_id=' + emp_id
  }


}
