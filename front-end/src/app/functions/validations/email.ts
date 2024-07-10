import { AbstractControl, ValidationErrors } from '@angular/forms';

export default function ValidateEmail(c: AbstractControl): ValidationErrors | null {
    let pattern: RegExp = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    //check email pattern
    if(pattern.test(c.value)) {
        return null;
    }else {
          // check if the value is NOT empty
          if(c.value){ 
              return {email:"Invalid email"};
          }else{
                return null;
          } 
    }
}