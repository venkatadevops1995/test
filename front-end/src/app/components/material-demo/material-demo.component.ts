import { Component, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { ThemePalette } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { DialogContentExampleComponent } from './dialog-content-example/dialog-content-example.component';
interface Food {
  value: string;
  viewValue: string;
}

@Component({
  selector: 'app-material-demo',
  templateUrl: './material-demo.component.html',
  styleUrls: ['./material-demo.component.scss']
})
export class MaterialDemoComponent implements OnInit {
  minDate: Date;
  maxDate: Date;

  isOpen: boolean = false;

  // 
  dateRange: FormControl = new FormControl(null, [Validators.required]);

  foods: Food[] = [
    { value: 'steak-0', viewValue: 'Steak' },
    { value: 'pizza-1', viewValue: 'Pizza' },
    { value: 'tacos-2', viewValue: 'Tacos' }
  ];

  constructor(public dialog: MatDialog) {
    const currentYear = new Date().getFullYear();
    this.minDate = new Date(currentYear - 1, 0, 1);
    this.maxDate = new Date(currentYear + 1, 11, 31);
  }

  ngOnInit(): void {
    this.dateRange.valueChanges.subscribe((val) => {
      // console.log(val)
    })

    setTimeout(() => {
      this.dateRange.setErrors({ test: true })
      // this.dateRange.updateValueAndValidity()
    }, 2000)
    // setTimeout(() => {
    //   let d = new Date();
    //   d.setHours(0, 0, 0, 0);
    //   this.dateRange.setValue({
    //     start: new Date(d.getTime() - 4 * 86400000),
    //     end: d
    //   })
    // }, 2000)
  }

  openDialog() {
    const dialogRef = this.dialog.open(DialogContentExampleComponent);

    dialogRef.afterClosed().subscribe(result => {
      // console.log(`Dialog result: ${result}`);
    });
  }
}
