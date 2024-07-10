import { FormGroup, FormArray } from '@angular/forms';
export const resetForm = (form: FormGroup | FormArray) => {

    let ctrls = form['controls'];
    form.markAsPristine();
    form.markAsUntouched();

    // inner function for resetting the form
    let loopAndReset =  (ctrls)=> {
        // if ctrls is a form array 
        if (ctrls instanceof Array) {
            //console.log(ctrls);
            ctrls.forEach((ctrl) => { 
                ctrl.markAsPristine();
                ctrl.markAsUntouched();
                let hasControls = ctrl.controls;
                if (hasControls) {
                    loopAndReset(ctrl.controls);
                }
            });
        } else {
            for (var key in ctrls) {
                // console.log(ctrls)
                if (ctrls.hasOwnProperty(key)) {
                    let ctrl = ctrls[key];
                    ctrl.markAsPristine();
                    ctrl.markAsUntouched(); 
                    let hasControls = ctrl.controls;
                    if (hasControls) {
                        loopAndReset(ctrl.controls);
                    }
                }
            }
        }
    }
    loopAndReset(ctrls);
    form.updateValueAndValidity();

}