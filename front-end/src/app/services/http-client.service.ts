import { XhrProgressService } from './xhr-progress.service';
import { Observable ,  Subscription ,  Subject } from 'rxjs';
import { Router } from '@angular/router';
// import { UserService } from './user.service';
import { SingletonService } from './singleton.service'; 
import { Injectable } from '@angular/core';
import { HttpClient, HttpRequest, HttpEventType, HttpParams, HttpHeaders, HttpEvent } from "@angular/common/http";
import * as _ from 'lodash';
import { catchError, filter, map } from 'rxjs/operators';
import { MatProgressBar } from '@angular/material/progress-bar';

interface authHttpExtras {
    baseUrl?: string;
    progress?: string; // can be "both", "upload", "download", ""
    progressValue?:any;
    progressBar?:MatProgressBar | any;
    loader?: boolean;
    responseType?: 'arraybuffer' | 'blob' | 'json' | 'text';
    [propName: string]: any;
}
@Injectable()
export class HttpClientService {

    // progress download observable
    progressDownload: Subject<any> = new Subject();

    // progress upload observable
    progressUpload: Subject<any> = new Subject();

    totalDownloadSize: number;

    constructor(
        private ss: SingletonService,
        public progressService: XhrProgressService,
        // public user: UserService,
        private router: Router,
        private httpClient: HttpClient
    ) {
        this.progressDownload.subscribe((e) => {
            // console.log(e.total, e.loaded);
            // console.log(e)
            if (this.totalDownloadSize && this.progressType === "download") {
                // if (!this.ss.progressBar.showProgress) {
                //     this.ss.progressBar.showProgress = true;
                // }
                let percentage = Math.floor((e.loaded / this.totalDownloadSize) * 100);
                // this.
                let percentageText = percentage + '%';
                // this.ss.progressBar.setProgressWidth(percentage);
                // console.log(this.totalDownloadSize, e.loaded, percentage)
                // if (percentageText === "100%") {
                //     this.ss.progressBar.showProgress = false;
                //     this.totalDownloadSize = undefined;
                // }
            }
        });
        this.progressUpload.subscribe((e) => {
            // console.log(e.total, e.loaded);
            if (this.progressType === "upload") {
                if (!this.ss.progressBar.showProgress) {
                    this.ss.progressBar.showProgress = true;
                }
                let percentage = Math.floor((e.loaded / e.total) * 100) + '%';
                this.ss.progressBar.setProgressWidth(percentage);
                // console.log(percentage)
                if (percentage === "100%") {
                    this.ss.progressBar.showProgress = false;
                }
            }
        });
    }

    progressType = "";

    // chainable method to use to set the type of progress to show for the current http request
    showProgress(progress) { // "upload", "download", "both"
        this.progressType = progress;
        //console.log(' from show progress');            
        return this;
    }

    authorizationHeader: boolean = true;

    // chainable method to be used to NOT show the loader during the http request
    noLoader(token: boolean = true) {
        if (token) {
            this.loaderToken = false;
        }
        return this;
    }

    noAuth() {
        this.authorizationHeader = false;
        return this;
    }

    // boolean token to validate to show or hide the loader during the http request
    loaderToken = true;

    request(
        method: 'GET' | 'PUT' | 'DELETE' | 'POST' | 'OPTIONS' | 'DELETE' | 'HEAD' | 'JSONP' | string,    // the xhr request method
        url,                       // the url of the request without request params
        params?: HttpParams | string, // the request params argument eg 'userName=123&id=23'
        body?: any,                        // the request body argument   
        headers?: HttpHeaders | object | '',
        options: authHttpExtras = {},
        withCredentials?: boolean,
    ) {
        let defaultRequestOptions = {
            baseUrl: this.ss.baseUrl,
            loader: true,
            progress: "",
            progressValue:null,
            progressBar:null,
            responseType: "json"
        }

        // process the input params
        let processedParams: HttpParams;

        if (typeof params == "string") {
            processedParams = new HttpParams();
            if (params !== "") {
                let splitParamsPairs = params.split('&');
                _.forEach(splitParamsPairs, (val) => {
                    let splitParam = val.split('=');
                    processedParams = processedParams.append(splitParam[0], splitParam[1]);
                })
            }
        } else if (params instanceof HttpParams) {
            processedParams = params;
        } else {
            processedParams = new HttpParams();
        }

        // process the input headers
        let processedHeaders: HttpHeaders;

        if ((headers instanceof Object)) {
            if ((headers instanceof HttpHeaders)) {
                processedHeaders = headers;
            }  else {
                processedHeaders = new HttpHeaders();
                _.forEach(headers, (val, key) => {
                    processedHeaders = processedHeaders.append(key, val);
                });
            }
        } else {
            processedHeaders = new HttpHeaders();
        }


        // construct the extended options using the lodash method
        let extendedOptions: authHttpExtras = _.assign(defaultRequestOptions, options);

        // console.log(extendedOptions,options,defaultRequestOptions);

        /* if (!this.user.validateSession()) {
            // with return url after login
            //this.router.navigate(['/login/' + this.user.getLoginType()], { queryParams: { returnUrl: this.router.url, rolePath: this.user.getRolePath() } });
            if (this.authorizationHeader) {
                //this.router.navigate(['/login/' + this.user.getLoginType()], { queryParams: { emailId: this.user.getUserEmail() } });
                //this.user.resetSession();
            } else {
                this.authorizationHeader = true;
            }

        } */

        let httpRequest = this.httpClient.request(new HttpRequest(
            method,
            extendedOptions.baseUrl + url,
            body,
            {
                reportProgress: true,
                params: processedParams,
                headers: processedHeaders,
                responseType: extendedOptions.responseType,
                withCredentials: withCredentials
            }
        ));
        // alert(JSON.stringify(processedHeaders));
        // return the observable by filtering the emission of the value based on the desired events of the request
        return httpRequest.pipe(filter((event) => {
            switch (event.type) {
                case HttpEventType.Sent:

                    // if loader token is true add url to have loader shown during this request
                    if (this.loaderToken) {
                        if (extendedOptions.loader) {
                            if(this.ss.loader)
                            this.ss.loader.append(url);
                        }
                    } else {
                        this.loaderToken = true;
                    }
                    // console.log("sent");
                    // we do not want to send this event in the stream of events for the http request
                    return false;

                case HttpEventType.ResponseHeader:
                    // console.log("headersresponse");
                    if (this.progressType === "download") {
                        this.totalDownloadSize = parseInt(event.headers.get('X-Content-Length'), 10);
                    }
                    // reset the progress bar width to 0
                    if (this.progressType === "download" || this.progressType === "upload") {

                        // this.ss.progressBar.setProgressWidth("0%");
                    }

                    return false;
                case HttpEventType.UploadProgress:
                    // console.log("upload progress");
                    if (this.progressType === "upload") {
                        // console.log("******")
                        let percentage = Math.floor((event.loaded / event.total) * 100);
                        if(extendedOptions.progressValue){
                            extendedOptions.progressValue.fn.call(extendedOptions.progressValue.this,[percentage])
                        } 
                        if(extendedOptions.progressBar){
                            extendedOptions.progressBar.value = Math.floor((event.loaded / extendedOptions.total) * 100);
                        }
                        this.progressUpload.next(event);
                    }
                    return false;
                case HttpEventType.DownloadProgress:
                    // console.log("download progress");
                    if (this.progressType === "download") {
                        this.progressDownload.next(event);
                    }
                    return false;
                case HttpEventType.Response:
                    // remove the url from the list of requests in the loader component
                    this.ss.loader.remove(url);
                    // hide the progress bar as the request has ended
                    this.ss.progressBar.hide();
                    // set back the total download size to undefined
                    this.totalDownloadSize = undefined;
                    // console.log("response");
                    // we always want to return the HttpResponse
                    return true;
                default:
                    // console.log("always");
                    return true;
            }
        }), catchError((err) => {
            
            // console.log(err);

            // remove the url from the list of requests in the loader component
            if(this.ss.loader){
                this.ss.loader.remove(url);
            }

            // handle the errors and return  the response
            return [err];
        }));
    }


}
