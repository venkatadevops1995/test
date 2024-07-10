import { TimeSheetService } from './time-sheet.service';
import { FormGroup, FormControl, FormArray } from '@angular/forms';
import { SingletonService } from './../../../services/singleton.service';
import { Component, OnInit, ViewEncapsulation, Input, SimpleChanges, HostListener, ViewChild, ElementRef, ChangeDetectionStrategy, ChangeDetectorRef, EventEmitter, Output, HostBinding, ViewChildren, QueryList } from '@angular/core';
import { isDescendant } from 'src/app/functions/isDescendent.fn';
import { debounceTime, take, takeUntil } from 'rxjs/operators';
import { emptyFormArray } from 'src/app/functions/empty-form-array.fn';
import { ModalPopupComponent } from 'src/app/components/modal-popup/modal-popup.component';
import { Subject } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from 'src/app/components/confirm-dialog/confirm-dialog.component';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AtaiBreakPoints } from 'src/app/constants/atai-breakpoints';

interface TimeSheet {
	week?: number;
}
@Component({
	selector: 'app-time-sheet',
	templateUrl: './time-sheet.component.html',
	styleUrls: ['./time-sheet.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimeSheetComponent implements OnInit {

	// subject to emit for clearing the subscriptions
	destroy$: Subject<any> = new Subject();
    is_LessThenTab:boolean=false;
	// the data passed (from backend)
	@Input() data: any;

	// the mode by default it is the timesheet entry mode
	@Input() mode: 'default' | 'resolve-timesheet' = 'default';

	// show / hide header ( in resolve timesheet we do not need header always)
	@Input() showHeader: boolean = true;

	// input property used to disable the whole time sheet
	@Input() disable: boolean;

	// disable approve and reject resolution in resolve-timesheet
	@Input() disableResolution: boolean = true

	// the data passed (from backend)
	@Input() translateTitle: number = 0;

	@HostBinding('style.--translate-title') get translateTitleGet() {
		return this.translateTitle + 'px';
	}

	// out put event
	@Output("evChange") onChange: EventEmitter<any> = new EventEmitter();

	// out put event
	@Output("projectChange") onProjectSelection: EventEmitter<any> = new EventEmitter();

	// out put event
	@Output("event") onClickEvent: EventEmitter<any> = new EventEmitter();

	// reference to the active mins element
	@ViewChild('selProject') elSelProject: ElementRef;

	// reference to the modal popup  before remove of project from timesheet
	@ViewChild(ModalPopupComponent) modalConfirmProjectRemoval: ModalPopupComponent;

	// the form group which holds the form controls of the time fields
	fgTimeFields: FormGroup;

	// the form group which holds the form controls of the totaltime fields
	fgTotalTimeFields: FormGroup;

	// property to hold the project index to remove from the timesheet during the confirmation in the modal pop up
	projectIndexToRemove: number;

	// boolean view token to show hide the select project list
	showProjectList: boolean = false;

	// initally before showing timesheet or error message
	isTimeSheetResolved: boolean = false;

	// boolean view token to show hide the whole timesheet based on input data 
	showTimeSheet: boolean = false;

	// boolean token to decide whether the timesheet data is valid for final submission
	canFinalSubmit: boolean = false;

	// visible active projects
	visibleActiveProjects: Array<any> = [];

	// hidden active projects which are listed in select project drop down
	hiddenActiveProjects: Array<any> = [];

	// array of keys to hold the boolean values which indicate which days of the week are currently enabled.
	holderInitialdata: any = [];

	// property which indicates whether the remove project was clicked atleast once
	removedAProject: boolean = false;

	// totalHours related Data 
	totalDayTimeMeta: Array<any> = [];

	//grand Total of all proj
	grandTotal: any;

	// timesheet form group value holder
	timesheetFgValueHolder: any = undefined;

	// form controls count in  active projects
	formControlsCount: number = 0;

	get is_MD_LT() {
		return this.ss.responsiveState[AtaiBreakPoints.MD_LT];
	}

	constructor(
		private ss: SingletonService,
		private cd: ChangeDetectorRef,
		private el: ElementRef,
		private tsService: TimeSheetService,
		private dialog: MatDialog
	) {
		this.ss.responsive.observe(AtaiBreakPoints.XS).subscribe(val => {
			this.is_LessThenTab = val.matches
		  })
		this.fgTimeFields = this.ss.fb.group({
			active_projects: this.ss.fb.array([]),
			'VACATION': this.ss.fb.array([]),
			'MISCELLANEOUS': this.ss.fb.array([]),
			'HOLIDAY': this.ss.fb.array([])
		});

		this.fgTotalTimeFields = this.ss.fb.group({
			total: this.ss.fb.array([])
		});



		// let faTotal = (<FormArray>this.fgTimeFields.get("total"))
		for (let i = 0; i < 7; i++) {
			(<FormArray>this.fgTotalTimeFields.get('total')).push(new FormControl({ h: 0, m: 0 }, []))
		}

		// on value changes the total hours should be calculated
		this.fgTimeFields.valueChanges.pipe(debounceTime(300), takeUntil(this.destroy$)).subscribe(val => {

			console.log("value changes")

			let totalAcc = [];

			this.totalDayTimeMeta = [];

			// accumulator for projects and vacation for all days . used to decide whether the timesheet can be ready for final submit
			let totalAccForFinalSubmit: any = []

			// if a project is removed then it is equala to a  changed value
			let hasValueChanged = this.removedAProject;
			let hasAllZerosInProject = false;

			for (let i = 0; i < 7; i++) {
				totalAcc.push({ h: 0, m: 0 });
				totalAccForFinalSubmit.push({ h: 0, m: 0 });
			}

			// reusable function to accumulate the time
			let processValue = (val, index, finalSubmitToken = false) => {
				if (val) {
					if (val.h) {
						totalAcc[index].h += val.h;
						if (finalSubmitToken) {
							totalAccForFinalSubmit[index].h += val.h;
						}
					}
					if (val.m) {
						// let valM = (val.m == "00" ? 0 : parseInt(val.m, 10))
						totalAcc[index].m += val.m;
						if (finalSubmitToken) {
							totalAccForFinalSubmit[index].m += val.m;
						}
					}
				}
			}

			//update totals in project
			let updateTotalInProject = (proj, val, updated_hours) => {
				if (val) {
					// console.log(proj);
					// console.log('updated_hours' + updated_hours);

					if (proj == 'HOLIDAY' || proj == 'MISCELLANEOUS' || proj == 'VACATION') {
						let hours = 0;
						hours = updated_hours.map(item => item.h).reduce((prev, next) => prev + next);
						// console.log(hours);

						this.data[proj].work_hours.forEach(element => {
							if (element.date == 'Total') {
								element.h = hours;
							}
						});

						let mins = 0;
						mins = updated_hours.map(item => item.m).reduce((prev, next) => prev + next);
						this.data[proj].work_hours.forEach(element => {
							if (element.date == 'Total') {
								element.m = 0;
								element.m = mins;
								// console.log(element.h);

								if (element.m >= 60) {
									element.h = hours + Math.floor(element.m / 60);
									element.m = element.m % 60;
								}
							}
						});
						// }
					}
					else {
						this.data['active_projects'].forEach(elementproj => {

							if (elementproj.project_name == proj) {
								let hours = 0;
								hours = updated_hours.map(item => item.h).reduce((prev, next) => prev + next);
								// if (val.h) {
								elementproj.work_hours.forEach(element => {
									if (element.date == 'Total') {
										element.h = hours;
									}
								});
								// }
								// if (val.m) {
								// let valM = (val.m == "00" ? 0 : parseInt(val.m, 10))
								let mins = 0;
								mins = updated_hours.map(item => item.m).reduce((prev, next) => prev + next);
								elementproj.work_hours.forEach(element => {
									if (element.date == 'Total') {
										element.m = mins;
										if (element.m >= 60) {
											element.h = hours + Math.floor(element.m / 60);
											element.m = element.m % 60;
										}
									}
								});
								// }
							}
						});
					}
				}
			}

			val.active_projects.forEach((project, index) => {
				let initialValues = this.holderInitialdata.visibleActiveProjects[index];
				console.log(initialValues)
				let foundNonZero = false;
				project.forEach((valInner, indexInner) => {
					if (valInner.h !== 0 || valInner.m !== 0) {
						foundNonZero = true;
					}
					processValue(valInner, indexInner, true)
					updateTotalInProject(initialValues['project_name'], valInner, project)
					let valInitial = initialValues.work_hours[indexInner];
					if (valInner.h !== valInitial.h || valInner.m !== valInitial.m) {
						console.log(valInner, valInitial)

						hasValueChanged = true;
						console.log(project);


					}
				});
				if (!foundNonZero) {
					hasAllZerosInProject = true;
				}
			});

			this.hiddenActiveProjects.forEach((project, index) => {
				let initialValues = this.holderInitialdata.hiddenActiveProjects[index];
				project.work_hours.forEach((valInner, indexInner) => {
					let valInitial = initialValues.work_hours[indexInner];
					if (valInner.h !== valInitial.h || valInner.m !== valInitial.m) {
						hasValueChanged = true;
						// updateTotalInProject(initialValues['project_name'],valInner,project)
					}
				});
			})

			val['VACATION'].forEach((day, index) => {
				processValue(day, index, true)
				updateTotalInProject('VACATION', day, val['VACATION'])
				let valInitial = this.holderInitialdata['VACATION'].work_hours[index];
				if (day.h !== valInitial.h || day.m !== valInitial.m) {
					hasValueChanged = true;
				}
				this.tsService.vacationArray[index] = day.h;
			})

			val['HOLIDAY'].forEach((day, index) => {
				processValue(day, index, true)
				updateTotalInProject('HOLIDAY', day, val['HOLIDAY'])
				let valInitial = this.holderInitialdata['HOLIDAY'].work_hours[index];
				if (day.h !== valInitial.h || day.m !== valInitial.m) {
					hasValueChanged = true;
					console.log(day);
					// day.total = day.total.h + day.h
				}
				this.tsService.holidayArray[index] = day.h;
			})
			console.log(val['HOLIDAY']);


			val['MISCELLANEOUS'].forEach((day, index) => {
				processValue(day, index, true)
				updateTotalInProject('MISCELLANEOUS', day, val['MISCELLANEOUS'])
				let valInitial = this.holderInitialdata['MISCELLANEOUS'].work_hours[index];
				if (day.h !== valInitial.h || day.m !== valInitial.m) {
					hasValueChanged = true;
				}
			});

			totalAcc.forEach((day, index) => {
				this.totalDayTimeMeta.push(day);
				if (day.m / 60 < 1) {
				} else {
					day.h += parseInt((day.m / 60) + "", 10);
					let dayM = (day.m % 60);
					day.m = dayM;
				}
			});

			let totalHours = this.totalDayTimeMeta.map(item => item.h).reduce((prev, next) => prev + next);
			let totalMins = this.totalDayTimeMeta.map(item => item.m).reduce((prev, next) => prev + next);
			if (totalMins >= 60) {
				totalHours = totalHours + Math.floor(totalMins / 60);
				totalMins = totalMins % 60;
			}

			this.grandTotal = ("00" + totalHours).slice(-JSON.stringify(totalHours).length) + ' : ' + ("00" + totalMins).slice(-2)
			let enableFinalSubmitArray = [];

			totalAccForFinalSubmit.forEach((day, index) => {
				if (day.m / 60 < 1) {
				} else {
					day.h += parseInt((day.m / 60) + "", 10);
					let dayM = (day.m % 60);
					day.m = dayM;
				}
				if (index == 0 || index == 1) {
					enableFinalSubmitArray[index] = true;
				} else {
					enableFinalSubmitArray[index] = (day.m >= 15 || day.h > 0);
				}
			})

			// function used to find out if the total is less than 24 hours
			let checkTotalForValidEntries = () => {
				let validity = true;
				totalAcc.forEach((item, index) => {
					if (item.h > 24) {
						validity = false;
						item.validity = false;
						item.showError = true;
					} else if (item.h == 24 && item.m != 0) {
						validity = false;
						item.validity = false;
						item.showError = true;
					} else {
						item.showError = false;
					}
					setTimeout(() => {
						item.showError = false;
						this.cd.detectChanges();
					}, 4000)
				})
				this.cd.detectChanges();
				return validity;
			}
			// check if all weekdays are filled with valid amount of hours > 15 mins
			this.canFinalSubmit = (enableFinalSubmitArray.indexOf(false) == -1) && checkTotalForValidEntries();
			this.fgTotalTimeFields.get('total').setValue(totalAcc)
			this.tsService.totalArray = totalAcc;
			console.log(this.totalDayTimeMeta)
			this.cd.detectChanges();
			// emit the change event with the data
			this.onChange.emit({
				canFinalSubmit: this.canFinalSubmit,
				hasValueChanged: hasValueChanged,
				hasAllZerosInProject: hasAllZerosInProject
			})
			// console.log(this.fgTotalTimeFields.value) 
		})

	}
	//Rahul changes(adding Tab nevigation)**********************************************
	public currentIndex: number = 0;
	list: number = 0;
	activeIndex;
	elements;
	@ViewChildren('select') select: QueryList<ElementRef>;
	@ViewChildren('text') text: QueryList<ElementRef>
	@ViewChildren('field') field: QueryList<ElementRef>
	public key_pressed(event) {
		// event.stopPropagation();
		// event.preventDefault();
		// this.list= Array.from(event.target.children).length;
		this.list = this.select.toArray().length;
		console.log('hello', this.list)
		// this.users = this.keyboardEventsManager.activeItem.item.name;
		if (event.keyCode == 27)
			this.showProjectList = false;
		if (event.keyCode == 13) {
			this.showProjectList = !this.showProjectList;

			this.select.toArray().forEach(element => {
				console.log('----->', element.nativeElement.classList.value)
				console.log('&&&&&&&&&&&&', this.currentIndex);

				if (element.nativeElement.classList.contains('grey')) {
					let i;
					i = element.nativeElement.getAttribute('index');
					console.log('!!!!!!!!!!!!!@@@@@@@@@', i)
					if (i === undefined || i == NaN) {
						return
					}
					else {
						//   console.log("I from if ", i);
						//   let projectToBeAdded = this.wsrActiveProjectsHidden[i];
						//       this.wsrActiveProjectsVisible.push(projectToBeAdded);
						//       this.wsrActiveProjectsHidden.splice(i, 1);
						//       (<FormArray>this.fgWsrProjects.get('active_projects')).push(new FormControl(""));
						//     this.cd.detectChanges();
						//   this.textarea.get(this.wsrActiveProjectsVisible.length-1).nativeElement.focus();
						//       this.showProjectList = false;
						// let index = Number(event.target.getAttribute(i));
						let projectToBeAdded = this.hiddenActiveProjects[i];
						this.visibleActiveProjects.push(projectToBeAdded);
						this.holderInitialdata.visibleActiveProjects.push(this.holderInitialdata.hiddenActiveProjects[i]);
						projectToBeAdded.addedIntoForm = true;
						this.hiddenActiveProjects.splice(i, 1);
						this.holderInitialdata.hiddenActiveProjects.splice(i, 1);
						let fa = this.ss.fb.array([]);
						for (let i = 0; i < 7; i++) {
							fa.push(new FormControl({ h: 0, m: 0 }, []))


						}
						(<FormArray>this.fgTimeFields.get('active_projects')).push(fa);

						// this.cd.detectChanges();
						// this.field.get(projectToBeAdded.work_hours).nativeElement.focus();

						projectToBeAdded.work_hours.push({ date: 'Total', enable: true, h: 0, m: 0 })
						this.showProjectList = false;
						this.onProjectSelection.emit({ type: 'add', project: projectToBeAdded });
					}
				}

			});





			// passing the event to key manager so we get a change fired
			console.log('enter has been pressed')
		}

		switch (event.keyCode) { //13
			case 38: //  arrow up
				event.stopPropagation();
				event.preventDefault();
				if (this.currentIndex <= 0)
					this.currentIndex = this.list - 1;
				else
					this.currentIndex = (this.currentIndex - 1) % this.list;

				console.log('keyup', this.currentIndex);
				break;
			case 40: //  arrow down
				event.stopPropagation();
				event.preventDefault();

				this.currentIndex = (this.currentIndex + 1) % this.list;
				console.log('keydown', this.currentIndex);
				break;
			default: this.currentIndex = 0;
		}
		this.cd.detectChanges();
		this.select.toArray().forEach((ele) => {
			let i;
			i = parseInt(ele.nativeElement.getAttribute('id'));
			console.log('!!!!!!!!!!!!!!!!!!', ele.nativeElement, i);
			if (this.currentIndex == i) {
				console.log('currentIndex::::::', this.currentIndex);
				ele.nativeElement.classList.add('grey');

			} else if (this.currentIndex !== i) {

				ele.nativeElement.classList.remove('grey');
			}
			console.log('hello i am true');
		});


	}

	//*************************************************************************************** 
	ngOnChanges(changes: SimpleChanges) {
		let data = changes.data;
		if (data && data.currentValue != data.previousValue) {
			let dataValue = data.currentValue;
			if (dataValue) {
				// get the active projects list which are going to be visible by adding first project into the visible list
				this.holderInitialdata = { ...dataValue };
				this.visibleActiveProjects = [];
				this.holderInitialdata.visibleActiveProjects = [];
				this.hiddenActiveProjects = [];
				this.holderInitialdata.hiddenActiveProjects = []
				if (dataValue.active_projects && dataValue.active_projects.length > 0) {
					emptyFormArray((<FormArray>this.fgTimeFields.get('active_projects')));
					dataValue.active_projects.forEach((project, index) => {
						if (project.visibilityFlag) {
							this.visibleActiveProjects.push(project);
							// the holder initial data should have visible hidden active projects in sync
							this.holderInitialdata.visibleActiveProjects.push(this.holderInitialdata.active_projects[index]);
							project.addedIntoForm = true;
							let fa = this.ss.fb.array([]);
							for (let i = 0; i < 7; i++) {
								fa.push(new FormControl(project.work_hours[i], []))
							}
							(<FormArray>this.fgTimeFields.get('active_projects')).push(fa);
						} else {
							this.hiddenActiveProjects.push(project);
							this.holderInitialdata.hiddenActiveProjects.push(this.holderInitialdata.active_projects[index]);
						}
					})
				}
				// add or reform the form controls into the form group which holds the time durations 
				emptyFormArray((<FormArray>this.fgTimeFields.get("VACATION")))
				emptyFormArray((<FormArray>this.fgTimeFields.get("MISCELLANEOUS")))
				emptyFormArray((<FormArray>this.fgTimeFields.get("HOLIDAY")))
				let faVacation = (<FormArray>this.fgTimeFields.get("VACATION"))
				let faMiscellaneous = (<FormArray>this.fgTimeFields.get("MISCELLANEOUS"))
				let faHoliday = (<FormArray>this.fgTimeFields.get("HOLIDAY"))
				// reset enable criteria 
				for (let i = 0; i < 7; i++) {
					if (dataValue['VACATION']) {
						faVacation.push(new FormControl(dataValue["VACATION"].work_hours[i], []))
					}
					if (dataValue['MISCELLANEOUS']) {
						faMiscellaneous.push(new FormControl(dataValue["MISCELLANEOUS"].work_hours[i], []))
					}
					if (dataValue['HOLIDAY']) {
						faHoliday.push(new FormControl(dataValue["HOLIDAY"].work_hours[i], []))
					}
				}
				this.showTimeSheet = true;
			} else {
				this.showTimeSheet = false;
				this.holderInitialdata = {};
			}
			this.isTimeSheetResolved = true
		}
	}

	ngOnInit(): void {

	}

	ngOnDestroy() {
		this.destroy$.next(null);
	}

	//on clicking view wsr show wsr of emp
	onClickResolveBtns(ev: 'view' | 'approve' | 'reject', data?: any) {
		this.onClickEvent.emit({ event: ev, data: data })
	}

	// event listener on document to check if active mins is clicked
	@HostListener("document:click", ['$event'])
	onClickDocument(e) {
		let target: any = e.target;
		if (this.elSelProject && isDescendant(this.elSelProject.nativeElement, target)) {
			let selBtn = this.elSelProject.nativeElement.querySelector('.sel-project__btn');
			let projectList = this.elSelProject.nativeElement.querySelector('.sel-project__project-list')
			if (target == selBtn || isDescendant(selBtn, target)) {
				this.showProjectList = !this.showProjectList;
			} else if (isDescendant(projectList, target) && target.classList.contains('sel-project__project')) {
				let index = Number(target.getAttribute("index"));
				let projectToBeAdded = this.hiddenActiveProjects[index];
				this.visibleActiveProjects.push(projectToBeAdded);
				this.holderInitialdata.visibleActiveProjects.push(this.holderInitialdata.hiddenActiveProjects[index]);
				projectToBeAdded.addedIntoForm = true;
				this.hiddenActiveProjects.splice(index, 1);
				this.holderInitialdata.hiddenActiveProjects.splice(index, 1);
				let fa = this.ss.fb.array([]);
				for (let i = 0; i < 7; i++) {
					fa.push(new FormControl({ h: 0, m: 0 }, []))
				}
				(<FormArray>this.fgTimeFields.get('active_projects')).push(fa);
				projectToBeAdded.work_hours.push({ date: 'Total', enable: true, h: 0, m: 0 })
				this.showProjectList = false;
				this.onProjectSelection.emit({ type: 'add', project: projectToBeAdded });
			}
			// else if (this.elSelProject && isDescendant(this.elSelProject.nativeElement, target) && target.classList.contains('sel-project__project')) {

			// }
		} else {
			this.showProjectList = false;
		}
	}


	// event listener on document to check if remove a project button is clicked
	@HostListener("click", ['$event'])
	onClickHost(e) {
		let target: any = e.target;
		let tempTarget = target;
		while (tempTarget != this.el.nativeElement) {
			// found remove row 
			if (tempTarget.classList.contains('timesheet__row-remove')) {
				this.projectIndexToRemove = parseInt(tempTarget.getAttribute('data-index'), 10);
				// this.modalConfirmProjectRemoval.open()
				let dialogRef = this.dialog.open(ConfirmDialogComponent, {
					panelClass: 'confirm-remove-project',
					backdropClass: 'cdk-overlay-darker-backdrop',
					data: {
						confirmMessage: 'Are you sure you want to remove the project ? All entries will be lost.'
					},
					restoreFocus: true
				})
				dialogRef.afterClosed().pipe(take(1)).subscribe(data => {
					// console.log(data)
					if (data) {
						this.removeProjectFromTimeSheet();
					}
				})
				break;
			}
			tempTarget = tempTarget.parentNode;
		}
	}


	// remove a project from timesheet                                                                                              
	removeProjectFromTimeSheet() {
		// remove the row from the list 
		this.removedAProject = true;
		this.visibleActiveProjects[this.projectIndexToRemove]['work_hours'].pop();
		let projectToBeRemoved = this.visibleActiveProjects.splice(this.projectIndexToRemove, 1)[0]
		this.hiddenActiveProjects.push(projectToBeRemoved);
		this.holderInitialdata.hiddenActiveProjects.push(this.holderInitialdata.visibleActiveProjects.splice(this.projectIndexToRemove, 1)[0]);
		(<FormArray>this.fgTimeFields.get('active_projects')).removeAt(this.projectIndexToRemove);
		this.onProjectSelection.emit({ type: 'remove', project: projectToBeRemoved });
		// this.modalConfirmProjectRemoval.close();
		this.cd.detectChanges();
	}

	// method used to get the current timesheet data which can be used in host component of this timesheet
	getTimeSheetData() {
		let data = { ...this.data }
		data['VACATION']['work_hours'] = this.fgTimeFields.get('VACATION').value.map((val, index) => {
			// console.log(data['VACATION']['work_hours'][index], this.fgTimeFields.get('VACATION').value)
			data['VACATION']['work_hours'][index].h = val.h;
			data['VACATION']['work_hours'][index].m = val.m;
			return data['VACATION']['work_hours'][index];
		})
		// delete data['VACATION']['work_hours'][7];
		data['MISCELLANEOUS']['work_hours'] = this.fgTimeFields.get('MISCELLANEOUS').value.map((val, index) => {
			data['MISCELLANEOUS']['work_hours'][index].h = val.h;
			data['MISCELLANEOUS']['work_hours'][index].m = val.m;
			return data['MISCELLANEOUS']['work_hours'][index];
		})
		// delete data['MISCELLANEOUS']['work_hours'][7];
		data['HOLIDAY']['work_hours'] = this.fgTimeFields.get('HOLIDAY').value.map((val, index) => {
			data['HOLIDAY']['work_hours'][index].h = val.h;
			data['HOLIDAY']['work_hours'][index].m = val.m;
			return data['HOLIDAY']['work_hours'][index];
		})
		// delete data['HOLIDAY']['work_hours'][7];
		let tempActiveProjects = this.fgTimeFields.get('active_projects').value.map((item, index) => {
			let temp = { ...this.visibleActiveProjects[index] };
			// delete temp['work_hours'][7];
			temp['work_hours'] = item.map((val, indexInner) => {
				temp['work_hours'][indexInner].h = val.h;
				temp['work_hours'][indexInner].m = val.m;
				return temp['work_hours'][indexInner];
			})
			return temp;
		})
		data['active_projects'] = tempActiveProjects;
		// data['active_projects'].forEach(element => {
		// 	element['work_hours'].pop();
		// });
		// this.hiddenActiveProjects.forEach(element => {
		// 	element['work_hours'].pop();
		// });
		// add the project which are added into the timesheet but are currently removed and set their h and m to 0
		this.hiddenActiveProjects.forEach((item, index) => {

			if (item.addedIntoForm) {
				item.work_hours.forEach(val => {
					val.h = 0;
					val.m = 0;
				})
				data['active_projects'].push(item);
			} else {
				data['active_projects'].push(item);
			}
		})
		return data
	}

	//adding total hours and minutes of weekly wise
	projectWeekTotal(hours) {
		let TotHours = 0;
		let TotMins = 0;
		//   console.log(hours);

		hours.forEach(element => {
			if (element.h >= 0) {
				TotHours = + TotHours + element.h;
			}
			if (element.h >= 0) {
				TotMins = + TotMins + element.m;
			}
		});
		if (TotMins >= 60) {
			TotHours = TotHours + Math.floor(TotMins / 60);
			TotMins = TotMins % 60;
		}
		// console.log(active);
		return ("00" + TotHours).slice(-2) + ' : ' + ("00" + TotMins).slice(-2)

	}

}
