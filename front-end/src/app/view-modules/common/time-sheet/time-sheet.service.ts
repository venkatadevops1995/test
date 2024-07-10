import { Injectable } from '@angular/core';

@Injectable()
export class TimeSheetService {
    totalArray = undefined;
    vacationArray = [];
    holidayArray = [];
    sundayAlert: boolean = false;
    saturdayAlert: boolean = false;
}
