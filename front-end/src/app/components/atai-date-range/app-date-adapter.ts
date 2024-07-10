import { Injectable } from "@angular/core";
import { NativeDateAdapter } from "@angular/material/core";

@Injectable()
export class AppDateAdapter extends NativeDateAdapter {


    /* 
    *   custom format for date picker
    */
    override format(date: Date, format: string | Object, isNative: boolean = false): string {
        let splitDate;
        if (!isNative) {
            if (format) {
                if (format instanceof Object) {
                    return super.format(date, format);
                } else {
                    if (format.indexOf('-') != -1) {
                        splitDate = format.split('-');
                    } else if (format.indexOf('-') != -1) {
                        splitDate = format.split('/');
                    }
                    let returnDate = [];
                    let month = super.getMonth(date) + 1;
                    let dateDay = super.getDate(date);
                    returnDate[splitDate.indexOf('dd')] = dateDay < 10 ? '0'+dateDay : dateDay;
                    returnDate[splitDate.indexOf('mm')] = month < 10 ? '0' + month : month;
                    returnDate[splitDate.indexOf('yyyy')] = super.getYear(date);
                    return returnDate.join('-');
                }
            } else {
                return date.toDateString();
            }

        } else {
            if (format) {
                return super.format(date, format);
            } else {
                return date.toDateString();
            }
        }
    }
}
