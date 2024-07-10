import { FormGroup, FormArray } from '@angular/forms';

// a function used to convert a reactive form value into a form data which can be used to pass was a request body.
export default function formToFormData(formData, key, value) {
  if (value instanceof Array) {
    value.forEach((item, index) => {
      if (value instanceof Object) {
        formData = this.formToFormData(formData, index, value);
      } else {
        formData[key + "_" + index] = value[index];
      }
    });
  } else if (!(value instanceof Array) && value instanceof Object) {
    for (var objKey in value) {
      if (value.hasOwnProperty(objKey)) {
        var element = value[key];
        if (value instanceof Object) {
          formData = this.formToFormData(formData, objKey, value);
        } else {
          formData[key + "_" + objKey] = value[objKey];
        }
      }
    }
  } else {
    formData[key] = value;
  }

  return formData;
}