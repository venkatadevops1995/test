import { Directive, Input, ElementRef, HostListener, Output, EventEmitter } from '@angular/core';
import { HttpClientService } from 'src/app/services/http-client.service';
import { HttpHeaders, HttpResponse } from '@angular/common/http';
import { WindowReferenceService } from 'src/app/services/window-reference.service';

declare global {
    interface Navigator {
        msSaveBlob?: (blob: any, defaultName?: string) => boolean
        msSaveOrOpenBlob?: any
    }
}

// interface for the FileDownload type
interface dbdFileDownload {
    endPoint: any;
    responseType?: any;
    method?: any;
    body?: any;
    baseUrl?: string;
    noLoader?: boolean;
}

@Directive({
    selector: '[dbdFileDownload]'
})
export class FileDownloadDirective {

    // declare the property of the directive to access the input value 
    @Input() dbdFileDownload: dbdFileDownload;

    @Output("onFinish") onFinish: EventEmitter<any> = new EventEmitter()

    anchor = document.createElement('a');

    constructor(
        private el: ElementRef,
        private httpClient: HttpClientService,
        private w: WindowReferenceService
    ) {

    }

    download(data, strFileName, strMimeType) {

        var self = this.w.nativeWindow, // this script is only for browsers anyway...
            defaultMime = "application/octet-stream", // this default mime also triggers iframe downloads
            mimeType = strMimeType || defaultMime,
            payload = data,
            url = !strFileName && !strMimeType && payload,
            anchor = document.createElement("a"),
            toString = function (a) { return String(a); },
            myBlob = (self.Blob || self['MozBlob'] || self['WebKitBlob'] || toString),
            fileName = strFileName || "download",
            blob,
            reader;
        myBlob = myBlob.call ? myBlob.bind(self) : Blob;
        var that = this;
        if (String(this) === "true") { //reverse arguments, allowing download.bind(true, "text/xml", "export.xml") to act as a callback
            payload = [payload, mimeType];
            mimeType = payload[0];
            payload = payload[1];
        }


        if (url && url.length < 2048) { // if no filename and no mime, assume a url was passed as the only argument
            fileName = url.split("/").pop().split("?")[0];
            anchor.href = url; // assign href prop to temp anchor
            if (anchor.href.indexOf(url) !== -1) { // if the browser determines that it's a potentially valid url path:
                var ajax = new XMLHttpRequest();
                ajax.open("GET", url, true);
                ajax.responseType = 'blob';
                ajax.onload = function (e) {
                    that.download(e.target['response'], fileName, defaultMime);
                };
                setTimeout(function () { ajax.send(); }, 0); // allows setting custom ajax headers using the return:
                return ajax;
            } // end if valid url?
        } // end if url?


        //go ahead and download dataURLs right away
        if (/^data:([\w+-]+\/[\w+.-]+)?[,;]/.test(payload)) {

            if (payload.length > (1024 * 1024 * 1.999) && myBlob !== toString) {
                payload = dataUrlToBlob(payload);
                mimeType = payload.type || defaultMime;
            } else {
                return (<any>navigator).msSaveBlob ?  // IE10 can't do a[download], only Blobs:
                    (<any>navigator).msSaveBlob(dataUrlToBlob(payload), fileName) :
                    saver(payload); // everyone else can save dataURLs un-processed
            }

        } else {//not data url, is it a string with special needs?
            if (/([\x80-\xff])/.test(payload)) {
                var i = 0, tempUiArr = new Uint8Array(payload.length), mx = tempUiArr.length;
                for (i; i < mx; ++i) tempUiArr[i] = payload.charCodeAt(i);
                payload = new myBlob([tempUiArr], { type: mimeType });
            }
        }
        blob = payload instanceof myBlob ?
            payload :
            new myBlob([payload], { type: mimeType });


        function dataUrlToBlob(strUrl) {
            var parts = strUrl.split(/[:;,]/),
                type = parts[1],
                decoder = parts[2] == "base64" ? atob : decodeURIComponent,
                binData = decoder(parts.pop()),
                mx = binData.length,
                i = 0,
                uiArr = new Uint8Array(mx);

            for (i; i < mx; ++i) uiArr[i] = binData.charCodeAt(i);

            return new myBlob([uiArr], { type: type });
        }

        function saver(url, winMode?: any) {

            if ('download' in anchor) { //html5 A[download]
                anchor.href = url;
                anchor.setAttribute("download", fileName);
                anchor.className = "download-js-link";
                anchor.innerHTML = "downloading...";
                anchor.style.display = "none";
                document.body.appendChild(anchor);
                setTimeout(function () {
                    anchor.click();
                    document.body.removeChild(anchor);
                    if (winMode === true) { setTimeout(function () { self.URL.revokeObjectURL(anchor.href); }, 250); }
                }, 66);
                return true;
            }

            // handle non-a[download] safari as best we can:
            if (/(Version)\/(\d+)\.(\d+)(?:\.(\d+))?.*Safari\//.test(navigator.userAgent)) {
                if (/^data:/.test(url)) url = "data:" + url.replace(/^data:([\w\/\-\+]+)/, defaultMime);
                if (!window.open(url)) { // popup blocked, offer direct download:
                    if (confirm("Displaying New Document\n\nUse Save As... to download, then click back to return to this page.")) { location.href = url; }
                }
                return true;
            }

            //do iframe dataURL download (old ch+FF):
            var f = document.createElement("iframe");
            document.body.appendChild(f);

            if (!winMode && /^data:/.test(url)) { // force a mime that will download:
                url = "data:" + url.replace(/^data:([\w\/\-\+]+)/, defaultMime);
            }
            f.src = url;
            setTimeout(function () { document.body.removeChild(f); }, 333);
            return false
        }//end saver




        if ((<any>navigator).msSaveBlob) { // IE10+ : (has Blob, but not a[download] or URL)
            return (<any>navigator).msSaveBlob(blob, fileName);
        }

        if (self.URL) { // simple fast and modern way using Blob and URL:
            saver(self.URL.createObjectURL(blob), true);
        } else {
            // handle non-Blob()+non-URL browsers:
            if (typeof blob === "string" || blob.constructor === toString) {
                try {
                    return saver("data:" + mimeType + ";base64," + self.btoa(blob));
                } catch (y) {
                    return saver("data:" + mimeType + "," + encodeURIComponent(blob));
                }
            }

            // Blob but not URL support:
            reader = new FileReader();
            reader.onload = function (e) {
                saver(this.result);
            };
            reader.readAsDataURL(blob);
        }
        return true;
    }

    // on clicking the fileDownload directive host
    @HostListener('click') onClick() {

        //set headers for the http request 
        var headers = new HttpHeaders();
        // headers.append('Content-Type', 'application/json');
        headers.append('Accept', 'application/octet-stream');

        let dataBlob;

        //headers.append('Cache-Control', 'max-age=86400');
        // let options = new RequestOptions({ headers: headers, responseType: ResponseContentType.Blob });

        // send the angular 2 http GET request to fetch the File Data ( Blob or Array Buffer ) using the API
        this.httpClient.noLoader(this.dbdFileDownload.noLoader).showProgress('download').request(this.dbdFileDownload.method, this.dbdFileDownload.endPoint, "", this.dbdFileDownload.body, headers, {
            responseType: this.dbdFileDownload.responseType,
            progress: 'download',
        })
            .subscribe((res: HttpResponse<any>) => {
                if (res.status === 200) {
                    // get the file name from the header - Content Disposition
                    let fileName: string = this.getFileName(res);

                    switch (this.dbdFileDownload.responseType) {
                        case "text":
                            dataBlob = this.b64toBlob(res.body);
                            break;
                        case "blob":
                            dataBlob = res.body;
                            break;
                        case "arrayBuffer":
                            //responseType = ResponseContentType.ArrayBuffer;
                            break;
                        case "json":
                            //responseType = ResponseContentType.Json;
                            break;
                        default:
                            dataBlob = res.body;
                            break;
                    }

                    if (this.dbdFileDownload.responseType === "text") {
                        this.openPopUp(dataBlob, fileName);
                    } else {
                        this.download(res.body, fileName, res['headers'].get('Content-Type'));
                    }
                    // on finish emit the event
                    this.onFinish.emit(true);
                } else {
                    // on finish emit the event
                    this.onFinish.emit(false);
                }

            });

    }




   // Adding event handeler for dowload button on enter key pressed 
   @HostListener('keydown.enter')pressEnter(){
    var headers = new HttpHeaders();
    // headers.append('Content-Type', 'application/json');
    headers.append('Accept', 'application/octet-stream');

    let dataBlob;

    //headers.append('Cache-Control', 'max-age=86400');
    // let options = new RequestOptions({ headers: headers, responseType: ResponseContentType.Blob });

    // send the angular 2 http GET request to fetch the File Data ( Blob or Array Buffer ) using the API
    this.httpClient.noLoader(this.dbdFileDownload.noLoader).showProgress('download').request(this.dbdFileDownload.method, this.dbdFileDownload.endPoint, "", this.dbdFileDownload.body, headers, {
        responseType: this.dbdFileDownload.responseType,
        progress: 'download',
    })
        .subscribe((res: HttpResponse<any>) => {
            if (res.status === 200) {
                // get the file name from the header - Content Disposition
                let fileName: string = this.getFileName(res);

                switch (this.dbdFileDownload.responseType) {
                    case "text":
                        dataBlob = this.b64toBlob(res.body);
                        break;
                    case "blob":
                        dataBlob = res.body;
                        break;
                    case "arrayBuffer":
                        //responseType = ResponseContentType.ArrayBuffer;
                        break;
                    case "json":
                        //responseType = ResponseContentType.Json;
                        break;
                    default:
                        dataBlob = res.body;
                        break;
                }

                if (this.dbdFileDownload.responseType === "text") {
                    this.openPopUp(dataBlob, fileName);
                } else {
                    this.download(res.body, fileName, res['headers'].get('Content-Type'));
                }
                // on finish emit the event
                this.onFinish.emit(true);
            } else {
                // on finish emit the event
                this.onFinish.emit(false);
            }

        });
   }

   //******************************************************************




    // get file name from the content disposition header
    getFileName(res): string {

        let fileName;

        let contentDisposition = res.headers.get('Content-Disposition');

        if (contentDisposition) {
            // split the header value at every occurence of  ; ( semicolon )
            let temp = contentDisposition.split(';');
            //console.log(temp);

            // loop through the array values of the split header value to get the string  eg: filename = xyz.ext
            temp.forEach(element => {
                if (element.indexOf('filename') != -1) {
                    // split the filename string to get the  real filename eg : xyz.ext
                    fileName = element.split('=');
                }
            });
            // console.log(fileName);

            // as we are splitting the array twice we get the " " wrapping twice so we strip them before return to get the file name xyz.ext and not "xyz.ext" 
            //console.log(fileName[1].replace(/\"/g, ''));

            return fileName[1].replace(/\"/g, '');
        }
        return undefined;

    }

    ngOnChanges(values) {
        this.dbdFileDownload = values.dbdFileDownload.currentValue;
        this.dbdFileDownload.responseType = this.dbdFileDownload.responseType || "blob";
        // by default we ll show the loader
        this.dbdFileDownload.noLoader = this.dbdFileDownload.noLoader || false;
        if (!this.dbdFileDownload.method) {
            this.dbdFileDownload.method = 'get';
        }
    }

    public openPopUp(data, fileName) {
        // if IE Browser
        if ((<any>window.navigator).msSaveBlob) {
            window.navigator.msSaveOrOpenBlob(data, fileName);
            // if non-IE browser
        } else {

            // create a window url to link to an anchor element created and trigger the click to open download dialog
            var url = window.URL.createObjectURL(data);

            // create the anchor element
            var ancorTag = document.createElement('a');

            // assign the window url to href attribute of the anchor created
            ancorTag.href = url;

            // set the target attribute to _blank to not open the url in our application window
            ancorTag.target = '_blank';

            // set the download attribute of the anchor tag to define the name of the file
            ancorTag.download = fileName;

            // append the anchor tag to the body
            this.w.nativeWindow.document.body.appendChild(ancorTag);

            // trigger click on the anchor tag
            ancorTag.click();

            // remove the anchor from the body
            this.w.nativeWindow.document.body.removeChild(ancorTag);

        }
    }

    // method to convert base 64 encoded string to blob
    b64toBlob(b64Data, contentType?: any, sliceSize?: any) {
        contentType = contentType || '';
        sliceSize = sliceSize || 512;

        var byteCharacters = atob(b64Data);
        var byteArrays = [];

        for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
            var slice = byteCharacters.slice(offset, offset + sliceSize);

            var byteNumbers = new Array(slice.length);
            for (var i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }

            var byteArray = new Uint8Array(byteNumbers);

            byteArrays.push(byteArray);
        }

        var blob = new Blob(byteArrays, { type: contentType });

        return blob;
    }

}
