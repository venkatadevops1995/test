import { Pipe, PipeTransform } from '@angular/core';


@Pipe({ name: 'objectToKVArray' })
export class ObjectToKVArrayPipe implements PipeTransform {
    transform(value): any {
        //console.log(value);

        if (!value) return [];
        if (!(value instanceof Object)) return null;
        let returnArray = [];
        for (var key in value) {
            if (value.hasOwnProperty(key)) {
                returnArray.push({
                    key: key,
                    value: value[key]
                });

            }
        }
        // console.log(returnArray);
        
        return returnArray;
    }
}

 