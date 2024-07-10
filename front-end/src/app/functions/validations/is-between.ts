import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export default function isBetween(start: number, end: number): ValidatorFn {
    return (c: AbstractControl) => {
        // check if the value is NOT empty
        if (c.value) {
            if (c.value >= start && c.value <= end) {
                return null;
            } else {
                return { isBetween: true };
            }
        } else {
            return null;
        }
    }
}