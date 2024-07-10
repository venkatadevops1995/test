import { Subject } from 'rxjs';
import { Validators, NgControl, AbstractControl, FormGroupDirective, NgForm, ControlContainer } from '@angular/forms';
import { Component, Input, forwardRef, AfterViewInit, ViewEncapsulation, ViewChild, ElementRef, AfterContentChecked, OnChanges, EventEmitter, Output, HostListener, Optional, Self, SimpleChanges, HostBinding } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor, FormControl } from '@angular/forms';
import { trigger, state, animate, transition, style } from '@angular/animations';
import { isDescendant } from '../../functions/isDescendent.fn';
import { MatFormFieldControl } from '@angular/material/form-field';
import { ErrorStateMatcher, CanUpdateErrorState,  mixinErrorState } from '@angular/material/core';
import { FocusMonitor } from '@angular/cdk/a11y';
import { takeUntil } from 'rxjs/operators';
import { fileExtensions } from './file-extensions'
import { UAParser } from 'ua-parser-js';

// to make the component show errors on submit of a form
class MatFileCompBase {
    constructor(public _defaultErrorStateMatcher: ErrorStateMatcher,
        public _parentForm: NgForm,
        public _parentFormGroup: FormGroupDirective,
        /** @docs-private */
        public ngControl: NgControl) { }
}
const _MatFileMixinBase = mixinErrorState(MatFileCompBase);

@Component({
    selector: 'app-file',
    templateUrl: './input-file.component.html',
    styleUrls: ['./input-file.component.scss'],
    providers: [
        { provide: MatFormFieldControl, useExisting: forwardRef(() => FileUploadComponent) }
    ],
    animations: [trigger(
        'visibilityChanged', [
        state('true', style({ 'height': '*', 'padding-top': '4px' })),
        state('false', style({ 'height': '0px', 'padding-top': '0px' })),
        transition('*=>*', animate('200ms'))
    ]
    )]
})
export class FileUploadComponent extends _MatFileMixinBase implements ControlValueAccessor, AfterViewInit, MatFormFieldControl<any>, CanUpdateErrorState {

    // used to unsubscribe subscriptions
    destroy$: Subject<any> = new Subject();

    @Input() override errorStateMatcher: ErrorStateMatcher;

    // for compatibility for angular material
    override stateChanges = new Subject<void>();

    // ID attribute for the field and for attribute for the label
    @Input() idd = "fileupload-" + Math.floor((Math.random() * 100) + 1);

    // for mat
    @HostBinding() id = `file-input-${this.idd}`;

    // The field name text . used to set placeholder also if no pH (placeholder) input is given
    @Input() text = "Drop files or add attachments here";

    // the ng Class attribute we can have on the wrapper div
    @Input() ngClassInput: string | Array<any> | Object;

    @Input() folderUpload: boolean = false;

    // change event emitter on the file upload component for the host of the component
    @Output() changeEE: EventEmitter<any> = new EventEmitter();

    // placeholder input
    @Input() pH: string;

    @Input() bgColor: any;

    @Input() borderColor: any;

    // placeholder input
    @Input() optional: boolean;

    @Input() val: string; // ? @Input()

    // for mat
    get placeholder() {
        return "";
    }
    set placeholder(plh) {
        this.pH = plh;
        this.stateChanges.next();
    }

    // set if multiple files selection is true or false
    @Input() multiple: boolean = false;

    // if there is an intial value like a path from backend or file name from backend 
    @Input() hasInitialValue: boolean = false;

    showInitialValue: boolean = false;

    // the file name or path from backend on initaliazing the component
    @Input() initialFileName: any = "";

    // the file name or path from backend on initaliazing the component
    @Input() initialFilePath: any = ""; 

    // reference to the file input element in this class
    @ViewChild('file') fileRef: ElementRef;

    // reference to the file input element in this class
    @ViewChild('fileLabel') fileLabelRef: ElementRef;

    // theme that needs to be applied to the component
    @Input() theme: string = "";

    // Property to store the files selected. An array of HTML file objects
    fileArray: Array<File> = Array();

    // boolean used to show / hide the loader animation while the files are process in memory on selection or drop
    showLoader:boolean = false;

    // for mat
    get value(): any {
        // console.log("value get")
        this.checkErrors();
        return this.fileArray;
    }
    // for mat
    set value(value: any) {

        this.fileArray = value;
        this.checkErrors();
        this.stateChanges.next();
    }

    get empty() {
        if(this.fileArray instanceof Array){
            return  this.fileArray.length < 1;
        }else{
            return this.fileArray;
        }
    }

    // for mat
    @HostBinding('class.floating')
    get shouldLabelFloat() {
        return this.focused || !this.empty;
    }
    // Property to store the file selected when multiple false. A HTML file object
    file: File;

    // the formats the file uploads should accept
    // below link gives all the different formats that have a known type by  file input which have an extension
    // https://www.iana.org/assignments/media-types/media-types.xhtml#image
    @Input() accept: any = { browser: '*', drop: false };

    @Input() acceptString: string = ""

    //current form control. helpful in validating and accessing form control
    control: AbstractControl | any;

    // errors array holder with initial value. Updated in the onChange methos to show updated 
    errors: Array<any> = ['Select the files Required'];

    @Input() errorMessages: Array<object> = []

    // for mat
    focused = false;


    @Input() getFile:any;

    constructor(
        private el: ElementRef,
        public override _defaultErrorStateMatcher: ErrorStateMatcher,
        public override _parentForm: NgForm,
        public override _parentFormGroup: FormGroupDirective,
        @Optional() @Self() public override ngControl: NgControl,
        private fm: FocusMonitor
    ) {
        super(_defaultErrorStateMatcher, _parentForm, _parentFormGroup, ngControl);
        fm.monitor(el.nativeElement, true).subscribe(origin => {
            this.focused = !!origin;
            this.stateChanges.next();
        });
        if (ngControl) {
            // set the value accessor to the current component instance
            ngControl.valueAccessor = this;
        }
    }

    validity: boolean = false;

    @HostBinding('attr.aria-describedby') describedBy = '';

    setDescribedByIds(ids: string[]) {
        this.describedBy = ids.join(' ');
    }

    controlType = 'file-input';

    ngDoCheck() {
        // console.log("from file input")
        if (this.ngControl) {
            // console.log(this.errorState);
            this.updateErrorState();
            // this.stateChanges.next();
        }
    }

 
    ngOnInit() {
        // set the control to the ngControl
        this.control = (this.ngControl) ? this.ngControl.control : new FormControl();
        // this.control.root.onSubmit
        // if the file Array is a file object rather than an array of file objects conver the file object into an array
        if ((this.fileArray instanceof Object) && !(this.fileArray instanceof Array)) {
            let temp = [];
            temp.push(this.fileArray);
            this.fileArray = temp;
        }
        // RESET the custom select form control UI when the form control is RESET
        if(this.getFile instanceof File && this.getFile!= undefined){
            // this.fileArray.push(this.getFile)
            // // log
            // this.fileArray.push(this.getFile)
            // this.multiple = false
            var e= new Event('manualFile')
            // this.control.setValue(this.getFile)
            this.onChange(e,[[this.getFile]])
            // this.multiple = false
        }
            // this.fileArray.push(this.getFile)
        
        this.control.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(
            () => {
                // console.log("value changes")
                // check condition if the form control is RESET
                if (this.control.value === "" || this.control.value === null || this.control.value === undefined) {

                    // reset innervalue property to empty string to get be in sync with the custom textarea control value
                    this.fileArray = [];


                    // check errors on reset to not keep empty error messages
                    // set Time out to trigger change detection
                    setTimeout(() => {
                        this.checkErrors();
                    });

                }
            }
        );
    }

    setErrors = (error) => {

        this.fileArray = (this.multiple || this.folderUpload) ? [] : [];
        // console.log(this.fileArray);
        this.setFileSize();
        this.propagateChange(this.fileArray);
        this.control.setErrors(error);

        this.checkErrors();
        this.markTouched();

    }

    checkFileAcceptable = (file) => {
        let returnValue = false;

        this.accept.drop.forEach(accept => {
            let type = accept;
            let specialType = type.split("/")[1];
            if (specialType != '*') {
                if (type.indexOf("*") == type.length - 1) {
                    let specialType = type.split("/")[0];
                    if (file.type.split('/')[0] == specialType) {
                        returnValue = true;
                    }
                } else {
                    if (accept == file.type) {
                        returnValue = true;
                    }
                    if (file.type == "") {
                        var parser = new UAParser();
                        // console.log(parser.getBrowser().name)
                        if(parser.getBrowser().name == 'Firefox'){
                        let file_name = file.name;
                        let specialType = type.split("/")[1];
                        if (file_name.split('.').pop() == specialType) {
                            returnValue = true;
                        }
                    }
                    }

                }
            }

            else {
                let specialType = type.split("/")[0];
                let file_name = file.name;
                let uploadFileExtension = file_name.split('.').pop();
                fileExtensions.forEach(element => {
                    if (element.key == specialType) {
                        let allExtensions = element.value;
                        if (allExtensions.includes(uploadFileExtension)) {
                            returnValue = true;
                        }
                        else {
                            returnValue = false;
                        }
                    }
                });
            }
        })
        return returnValue;
    }

    // the method which is called when files are dropped
    drop_handler(ev: Event, target) {
        setTimeout(()=>{
            this.showLoader = true; 
        })
        this.control.setErrors({})
        this.checkErrors();
        ev.preventDefault();

        if (target === this.el.nativeElement || this.el.nativeElement.contains(target)) {
            this.fileArray = [];
            this.el.nativeElement.classList.remove('dragover');

            // If dropped items aren't files, reject them
            var dt = ev['dataTransfer'];

            // decide if files are needed or items are needed
            let files = (dt.items && this.folderUpload) ? dt.items : dt.files;
            this.fileArray = [];
            let directoriesFound = 0
            let shouldPropagate = true;
            let handleDrop = (e) => {
                e.stopPropagation();
                e.preventDefault();
                let returnObj = { files: false, folder: false };
                var files = e.dataTransfer.files;

                for (var i = 0, f; f = files[i]; i++) { // iterate in the files dropped
                    if (!f.type && f.size % 4096 == 0) {
                        // The file is a folder
                        // Do something
                        f.xtype = "folder";
                        returnObj.folder = true;
                        // console.log("folder", f)
                    } else {
                        // The file is not a folder
                        // Do something else
                        f.xtype = "file";
                        returnObj.files = true;
                        // console.log("file", f)
                    }
                }
                return returnObj;
            }

            let dropData: { files: boolean, folder: boolean } = handleDrop(ev)

            // if single file is expected
            if (!this.multiple && !this.folderUpload) {
                if (files.length > 1) {
                    // console.log("only one file allowed")
                    this.setErrors({ onlyOneFile: true }) 
                    return
                }else if(dropData.folder){
                    this.setErrors({ onlyFile: true }) 
                    return
                }
                this.fileArray = files; 
            }
            // if multiple files are expected
            if (this.multiple && !this.folderUpload) {
                if (dropData.folder) {
                    // console.log("only files allowed") 
                    this.setErrors({ onlyFile: true });
                    return
                }
                this.fileArray = Array.from(files); 
            }


            if (this.accept.drop) {
                // check if unwanted formats are existing
                for (let i = 0; i < this.fileArray.length; i++) {
                    let file = this.fileArray[i]
                    let check = this.checkFileAcceptable(file);
                    // console.log(check)
                    if (!check) {
                        // console.log("unacceptabnle in flow")
                        this.setErrors({ unAcceptedFile: true })
                        shouldPropagate = false
                    }
                }
            }
            // console.log("setting final files");
            let traverseFileTree = (item, path?: any, directoriesFoundArg?: number) => {
                path = path || "";
                if (item.isFile) {
                    // Get file
                    // let temp =item.getAsFile()
                    // console.log(temp)
                    item.file((file) => {
                        // check if the files added are satisfying the acceptable formats. if acceptable the push else abort the whole upload
                        // if(file.type)
                        if (this.accept.drop) {
                            let check = this.checkFileAcceptable(file);
                            if (!check) {
                                // console.log("unacceptabnle while traverse")
                                this.setErrors({ unAcceptedFile: true });
                                shouldPropagate = false;
                                this.fileArray = [];
                                return;
                            } else {
                                this.fileArray.push(file);
                            }
                        } else {
                            this.fileArray.push(file);
                        }
                        // console.log( file.name) 
                    });
                } else if (item.isDirectory) {
                    // Get folder contents
                    var dirReader = item.createReader();
                    // if(directoriesFound > 2){ 
                    //     return;
                    // }
                    var fnReadEntries = (function () {
                        return function (entries) {
                            entries.forEach(function (entry, i) {
                                if (entry.isDirectory) {
                                    ++directoriesFound;
                                }
                                traverseFileTree(entry, path + item.name + "/");

                                // console.log(finalFiles.length)

                            });
                            if (entries.length > 0) {
                                dirReader.readEntries(fnReadEntries);
                            }
                        };
                    })();
                    dirReader.readEntries(fnReadEntries);
                }
            }
            // console.log(finalFiles)
            // if folder is expected
            if (this.folderUpload && !this.multiple) {
                if (dropData.files) {
                    // console.log("folder upload only")
                    var parser = new UAParser();
                    if(parser.getBrowser().name == 'Safari'){
                        this.setErrors({ safariFolder: true })
                    }
                    else{
                    this.setErrors({ onlyFolder: true })
                    }
                    this.fileArray = [];
                    setTimeout(() => {
                        this.showLoader = false; 
                    });
                    return
                }
                if (dropData.folder && files.length > 1) {
                    this.setErrors({ onlyOneFolder: true })
                    this.fileArray = [];
                    setTimeout(() => {
                        this.showLoader = false; 
                    });
                    return
                }

                for (var i = 0; i < files.length; i++) {
                    let item = dt.items[i].webkitGetAsEntry();
                    // let item = dt.items[i].getFilesAndDirectories();
                    
                    traverseFileTree(item);
                }

                // console.log(directoriesFound)
                setTimeout(() => {
                    if (this.folderUpload) {
                        if (directoriesFound > 0) {
                            this.setErrors({ noSubFolder: true })
                            shouldPropagate = false
                        } else {
                            
                        }
                    }
                }, 350)
            }

            // TODO: if multiple folders are expected
            setTimeout(() => {
                // console.log(directoriesFound)
                if (shouldPropagate) {
                    // this.fileArray = finalFiles; 
                    // update the formcontrol value
                    if (this.multiple || this.folderUpload) {
                        this.propagateChange(this.fileArray);
                    } else {
                        this.fileArray = [this.fileArray[0]]; 
                        this.propagateChange(this.fileArray[0]);
                    }
                }else{
                    this.fileArray=[];
                }
                // console.log(this.fileArray.length)
                this.setFileSize();
                this.showLoader = false; 
            }, 400)

        }
    }

    @HostListener('window:dragover', ['$event', '$event.target'])
    onDragOver(e: Event, target) {
        e.preventDefault();
        if (target === this.el.nativeElement || this.el.nativeElement.contains(target)) {
            this.el.nativeElement.classList.add('dragover');
        }
    }

    @HostListener('window:dragleave', ['$event', '$event.target'])
    onDragLeave(e: Event, target) {
        e.preventDefault();
        if (target === this.el.nativeElement || this.el.nativeElement.contains(target)) {
            this.el.nativeElement.classList.remove('dragover');
        }
    }

    onContainerClick(event: MouseEvent) {
        if ((event.target as Element).tagName.toLowerCase() != 'input') {
            // this.el.nativeElement.querySelector('input').focus();
        }
    }
    //function to check validation an formulate errors
    checkErrors() {
        // console.log(this.control.errors)
        //reset and set, update errors
        this.errors = [];
        for (var key in this.control.errors) {
            let defaultMessage = true;
            this.errors.push(key);
        }
        if (this.errors.length > 0) {
        } else {
        }
        this.stateChanges.next();
        // console.log(this.control.errors);
        setTimeout(() => {
            this.validity = Boolean(this.control && this.control.touched && !this.control.valid);
        }, 100);
    }

    isBrowserOpen :boolean = false;

    onClick(){
        this.isBrowserOpen = true;
        this.showLoader=true;
    }

    @HostListener('window:focusout', ['$event', '$event.target'])
    onBlur(e: Event, target) {
        if (target.classList.contains('file-wrap') || target == this.el.nativeElement || isDescendant(this.el.nativeElement, target)) {
            setTimeout(() => {
                this.markTouched();
                this.checkErrors();
                if(this.isBrowserOpen){
                    this.showLoader=false;
                }
            }, 100);
        }
    }

    keyUp(e: Event, target) {
        if (e['keyCode'] === 13) {
            this.fileRef.nativeElement.click();
        }
    }


    // life cycle hook of component after the view is initialized
    ngAfterViewInit() {

        // use set time out to trigger angular change detection when the pH is set irrespective of the host component's rendering to avoid changed value of pH after it is rendered inside the host component.
        setTimeout(() => {
            if (this.pH === undefined) {
                //this.pH = "Select " + this.text; // set placeholder default value when no input given to pH property
                this.pH = "";
            }
        });


        if (this.val === undefined) {
            this.val = this.idd; // set val default value when no input given to pH property
        }

        //set file upload to multiple or single as per input of multiple property which is a boolean
        this.fileRef.nativeElement.multiple = true;
        if (this.multiple === false) {
            this.fileRef.nativeElement.multiple = false;
        }
        // to RESET UI when the form or form control is RESET
        this.control.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(
            () => {
                if (!this.fileArray) {
                    this.fileArray = [];
                }
            }
        );

    }

    //update the selected files list when removing a file by clicking the cross icon. isInitialValue is used to know if the delete of file is that of an initial value given to file
    upDateFileList(e: Event, index, isInitialValue: boolean = false) {
        if (index == false) {
            this.fileArray = []
            this.setFileSize();
            this.propagateChange(this.fileArray);
            this.changeEE.emit(this.fileArray);
            this.checkErrors();
            return
        }
        if (!isInitialValue) {
            this.fileArray.splice(index, 1); // remove the deleted file from the fileArray

            if (this.multiple || this.folderUpload) {
                this.setFileSize();
                this.propagateChange(this.fileArray); // update the form control value
            } else {
                this.setFileSize();
                this.propagateChange(this.fileArray[0]);
            }

            // make the value available in the event emitted
            this.changeEE.emit(this.fileArray);

            this.checkErrors(); // update errors
            if (!this.fileArray) {
                this.fileArray = [];
            }
        } else {
            this.fileArray = [];
            this.setFileSize();
            this.propagateChange("");
            this.showInitialValue = false;
        }


    }

    //mark the custom form control as touched when somebody clicks the upload button
    markTouched() {
        this.control.markAsTouched(); // mark the form control as touched
        this.control.markAsDirty(); // mark the form control as touched
        this.control.markAsPristine(); // mark the form control as not pristine (*not working)
    }
 
    //get the size of a file. Used to display the size in the list of select files in the UI
    setFileSize() {
        let size =0; 
        this.fileArray.forEach((file)=>{
            size += file.size;
        });
        (<any>this.control).fileSize = size;
        // console.log(size,this.fileArray.length)
    }

    @Input()
    get required() {
        return !this.optional;
    }
    set required(req) {
        this.optional = !req;
        this.stateChanges.next();
    }

    // for mat
    @Input()
    get disabled(): boolean { return this._disabled; }
    set disabled(value: boolean) {
        this.stateChanges.next();
    }
    private _disabled = false;

    // event fired when input value is changed . later propagated up to the form control using the custom value accessor interface
    onChange(e: Event, value: any) {
        // console.log(value[0]);
        // console.log("on change", value);
        let twoMegaByte = 2 * 1024 * 1024
        setTimeout(()=>{
            this.showLoader = true; 
            // console.log(this.showLoader);
        })
        let shouldPropagate = true;
        if(value[0].size >= twoMegaByte){
            console.log("please use file less than 2 mb");
            this.setErrors({ maxSize: true });
            return 
        }

        // reset & update file array with new selected files if multiple
        if (value.length) {
            // reset the file Array when new files are selected
            this.fileArray = [];
            for (var key in value) {
                if (value.hasOwnProperty(key)) {
                    // make sure the key is not "length" and "item"
                    if ((parseInt(key, 10) !== NaN) && ((typeof value[key]) === 'object')) {
                        let file = value[key];
                        if (this.accept.drop ) {
                            let check = this.checkFileAcceptable(file)
                            if (!check) {
                                // dont known why from some other place the errors on this.control is set to null after setting this so using a set timeout to overcome this problem. looks mysterious why the errors on this.control is set to null
                                setTimeout(() => {
                                    // console.log("unacceptabnle on change")
                                    this.setErrors({ unAcceptedFile: true });
                                }, 350);
                                shouldPropagate = false;
                                // break; 
                            }
                            let matchSlash = file.webkitRelativePath.match(/\//g);
                            if (matchSlash  && matchSlash.length > 1) {
                                setTimeout(() => {
                                    this.setErrors({ noSubFolder: true })
                                }, 350);
                                shouldPropagate = false;
                                // break;
                            }
                        }
                        this.fileArray.push(value[key]);
                    }
                }
            }

            this.showInitialValue = false;
            if (shouldPropagate) {
                if (this.multiple) {
                    this.propagateChange(this.fileArray);
                } else {
                    if (this.folderUpload) { 
                        this.propagateChange(this.fileArray);
                    } else { 
                        this.propagateChange(this.fileArray[0]);
                    }
                }
            } else {
                this.fileArray = (this.multiple || this.folderUpload) ? [] : []; 
                this.propagateChange(this.fileArray);
            }
            this.setFileSize();
            // make the value available in the event emitted
            if(e.type != "manualFile"){
                this.changeEE.emit(this.fileArray);
            // if (this.fileRef != undefined)
                this.fileRef.nativeElement.value = ""; // resetting the filelist of input file (to avoid a mismatch b/w file array and file list when the user selects same files as the browser does not trigger change event.) by giving it an empty string
            }
                this.checkErrors(); // update Errors
            setTimeout(() => {
                this.showLoader = false;
                // console.log(this.control.errors);
            })
        }

    }


    //propagate changes into the form
    propagateChange = (_: any) => { }

    //From ControlValueAccessor interface. Refer to angular.io for more info
    writeValue(value: any) {
        setTimeout(() => {
            if (this.hasInitialValue) {
                if (this.showInitialValue) {
                    this.initialFilePath = value;
                }
            } else {
                this.fileArray = value ? value : [];
            }
        }, 50)
    }

    //From ControlValueAccessor interface. Refer to angular.io for more info
    registerOnChange(fn: any) {
        this.propagateChange = fn;
    }

    //From ControlValueAccessor interface. Refer to angular.io for more info
    registerOnTouched(fn: any) {

    }
    ngOnDestroy() {
        this.stateChanges.complete();
        this.destroy$.next(null);
        this.fm.stopMonitoring(this.el.nativeElement);
    }
}