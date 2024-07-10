import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UserService } from 'src/app/services/user.service';
import { HttpClientService } from 'src/app/services/http-client.service';
import { SingletonService } from 'src/app/services/singleton.service';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { HttpParams } from '@angular/common/http';
import { ModalPopupComponent } from 'src/app/components/modal-popup/modal-popup.component';
import { Observable } from 'rxjs';
import { map, startWith, subscribeOn } from 'rxjs/operators';
import { async } from '@angular/core/testing';
import { AtaiDateRangeComponent } from 'src/app/components/atai-date-range/atai-date-range.component';

@Component({
  selector: 'app-add-project',
  templateUrl: './add-project.component.html',
  styleUrls: ['./add-project.component.scss']
})
export class AddProjectComponent implements OnInit {

  allProjects = [];
  project_list_search = [] ;
  isDisabledSave:boolean = false
  filterAllActiveInactiveProject:any;
  USERS_DATA = [];
  filter_projects = [];
  projectInputField = this.fb.control('',[]); 

  constructor(
    public dialog: MatDialog,
    private ss: SingletonService,
    private http: HttpClientService,
    private fb: FormBuilder,
    private user: UserService,
    private cdRef:ChangeDetectorRef
  ) {
  
   this.projectInputField.valueChanges
        .pipe(
          map(
            (state)=>{
              return  state ? this.filterAllActiveInactiveProjectList(state) : this.project_list_search.slice(0)
            }
          )
        )
        .subscribe ((project)=>{        
          this.filterAllActiveInactiveProject = project     
          // console.log("####5678",this.projectInputField.value.length);
          let inputvalue = this.projectInputField?.value?.trim();
          // console.log("Input value after trim:",inputvalue?.length);
          this.isDisabledSave = project.some( p =>  p.name === inputvalue);
          // console.log(" isDisabledSave value from input chnaged: ", this.isDisabledSave);

          // this.isDisabledSave = project.map(p=> p.name.includes(inputvalue))

        })
     
    }

  ngOnInit(): void {
    this.getAllActiveInActiveProjects();   
  }

  private filterAllActiveInactiveProjectList(value: string) {
    const filterValue = value.toLowerCase();
    let result = this.project_list_search.filter(project => {
      return project.name.toLowerCase().includes(filterValue)
    })
    return result
  }

  getAllActiveInActiveProjects(){
    // this.allProjects=[]
    // console.log("-----------------",this.projectInputField.value)
    this.http.request("get", "projects-active-inactive/").subscribe(res => {
      if(res.status === 200){
        let project_list = []
        res.body["results"].forEach(ele => {
          // console.log("---------------",ele)
          Array.prototype.push.apply(project_list, [ele]);      
        })
        // console.log('----------------project_list--',project_list)

        this.USERS_DATA = project_list;
        this.allProjects = [...this.USERS_DATA]
        let allProjects = [...this.USERS_DATA];
        allProjects.forEach(element => {
          this.project_list_search.push(element);
          // Rahul change (assigning value to initialize the project on load)
          this.filterAllActiveInactiveProject=this.project_list_search;
          //************************************************************ 
        });
        // console.log("data in project list search",this.project_list_search)
      }

    });
  };
  clear(){
    this.projectInputField.reset();
    this.projectInputField.setValue('');
    this.projectInputField.updateValueAndValidity()
   }


  //  on option seletcted change 
  optionSelectChange(proj_name){
    // console.log("Project name in option selection:",proj_name)
    this.isDisabledSave = this.allProjects.some(p =>p.name === proj_name);
    // console.log("isDisbaleSave value from option select:",this.isDisabledSave)

  }


  //  save the project 
  saveProject(){ 
    // console.log("Save project......");
    // console.log(this.projectInputField.value);
    let formData = {name : this.projectInputField.value.trim()}
    this.http.request('post', 'save-project/', '', formData).subscribe(res => {
      if (res.status == 201) {
        this.project_list_search = []
        this.getAllActiveInActiveProjects();  
        this.ss.statusMessage.showStatusMessage(true, "Project has been created successfully")
      } else if (res.status == 400) {
        // console.log("400 error:",res.error.message)
        this.ss.statusMessage.showStatusMessage(false, res.error.message);

      } else if (res.status == 406) {
        // console.log("400 error:",res.error.message.name[0])
        this.ss.statusMessage.showStatusMessage(false, res.error.message.name[0]);
      }
    })
    this.isDisabledSave = false
    this.projectInputField.reset();
    this.projectInputField.setValue('');
    this.projectInputField.updateValueAndValidity()

  }
}
