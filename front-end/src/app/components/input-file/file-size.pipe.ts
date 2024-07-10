import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'fileSize'
})
export class FileSizePipe implements PipeTransform {
    transform(value: any, ...args: Array<any>): any {
        let str = ""; 
        if (value) {
            if (value < 1048576) { // if the value needs to be given in kilo bytes
                str = Math.ceil(value / 1024) + ' KB';
            } else if (value < 1073741824) { // if the value needs to be given in Mega bytes
                str = (Math.ceil((value / 1048576) * 100) / 100) + ' MB';
            } else { // if the value needs to be given in Giga bytes
                str = (Math.ceil((value / 1073741824) * 100) / 100) + ' GB';
            }
        }
        return str;
    }
}
