import { FormArray } from '@angular/forms';
export const emptyFormArray = (formArray: FormArray) => {
    formArray.removeAt(formArray.length - 1);
    if (formArray.length > 0) {
        emptyFormArray(formArray);
    } else {
        return;
    }
}