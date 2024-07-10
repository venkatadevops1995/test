import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export default function MatchPassword(controlName): ValidatorFn {
    return (c: AbstractControl)=>{
        if(c.value){
            if(c.value.trim() === ""){
                return null
            }
            if (c.root.get(controlName)) { 
                return (c.value.trim() !== "" && c.root.get(controlName).value === c.value) ? null : { notMatching: true };
            }
        }else{
            return null
        }
    }
}