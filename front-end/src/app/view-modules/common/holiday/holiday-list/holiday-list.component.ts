import { ChangeDetectorRef, Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { isDescendant } from 'src/app/functions/isDescendent.fn';

@Component({
  selector: 'app-holiday-list',
  templateUrl: './holiday-list.component.html',
  styleUrls: ['./holiday-list.component.scss']
})
export class HolidayListComponent implements OnInit {
  headerItems = ["Date", "Day", "Description"]
  headerLocation=[ "Hyderabad","Banglore","Delhi"]
  HOLIDAYLIST_TESTDATA = [
  {date:'2021-01-01',day:'Friday',des:"New Year",hyd:true, blr:true,delhi:true},
  {date:'2021-01-14',day:'Friday',des:"Sankranti",hyd:true, blr:true,delhi:false},
  {date:'2021-04-13',day:'Friday',des:"Ugadi",hyd:true, blr:false,delhi:false},
  {date:'2021-05-01',day:'Friday',des:"May day",hyd:true, blr:true,delhi:true},
  {date:'2021-12-25',day:'Friday',des:"Christmas",hyd:true, blr:true,delhi:true}
]
@ViewChild('selProject') elSelProject: ElementRef;
  holidayList :any[]= this.HOLIDAYLIST_TESTDATA;
  holidayIndexToRemove = 0
  constructor(	private cd: ChangeDetectorRef,
		private el: ElementRef, private fb:FormBuilder) { }

  ngOnInit(): void {
  }
  // holidayForm = this.fb.array({

  // })

  @HostListener("document:click", ['$event'])
	onClickDocument(e) {
		let target: any = e.target;
		if (this.elSelProject && target == this.elSelProject.nativeElement) {
      
      let index = Number(target.getAttribute("index"));
			let projectToBeAdded = {};
			this.holidayList.push(projectToBeAdded);
		} else if (this.elSelProject && isDescendant(this.elSelProject.nativeElement, target) ) {
			let index = Number(target.getAttribute("index"));
			let projectToBeAdded = {};
			this.holidayList.push(projectToBeAdded);
	
			// let fa = this.ss.fb.array([]);
		// 	for (let i = 0; i < 7; i++) {
		// 		fa.push(new FormControl({ h: 0, m: 0 }, []))
		// 	}
		// 	(<FormArray>this.fgTimeFields.get('active_projects')).push(fa);
		// 	projectToBeAdded.work_hours.push({date:'Total',enable: true,h:0,m:0})
		// 	this.showProjectList = false;
		// } else {
		// 	this.showProjectList = false;
		// }
  }
}
  
  // event listener on document to check if remove a project button is clicked
	@HostListener("click", ['$event'])
	onClickHost(e) {
		let target: any = e.target;
    let tempTarget = target;
    // console.log("--------------click");
		while (tempTarget != this.el.nativeElement) {
			// found remove row 
			if (tempTarget.classList.contains('timesheet__row-remove')) {
        this.holidayIndexToRemove = parseInt(tempTarget.getAttribute('data-index'), 10);
        this.removeProjectFromTimeSheet();
				// this.modalConfirmProjectRemoval.open()
				break;
			} else if (tempTarget.classList.contains('remove-project-cancel')) {
				// close the confirm project removal pop up        
				// this.modalConfirmProjectRemoval.close()
				break;
			} else if (tempTarget.classList.contains('remove-project-proceed')) {
				// close the confirm project removal pop up        
				this.removeProjectFromTimeSheet();
				// this.modalConfirmProjectRemoval.close()
				break;
			}
			tempTarget = tempTarget.parentNode;
		}
  }
  	// remove a project from timesheet                                                                                              
	removeProjectFromTimeSheet() {
    // console.log("-------------------")
    this.holidayList.splice(this.holidayIndexToRemove, 1)
    // remove the row from the list 
    
		// this.removedAProject = true;

		// this.hiddenActiveProjects.push(this.visibleActiveProjects.splice(this.holidayIndexToRemove, 1)[0]);
		// this.holderInitialConfig.hiddenActiveProjects.push(this.holderInitialConfig.visibleActiveProjects.splice(this.holidayIndexToRemove, 1)[0]);
		// (<FormArray>this.fgTimeFields.get('active_projects')).removeAt(this.holidayIndexToRemove);
		// this.modalConfirmProjectRemoval.close();
		this.cd.detectChanges();
	}

}
