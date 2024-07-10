import { Subject } from 'rxjs';
import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse, HttpHeaders } from "@angular/common/http";
import { SingletonService } from "src/app/services/singleton.service";
import { HttpClientService } from './http-client.service';

@Injectable({
    providedIn: 'root'
})
export class PollingService {

    timeoutRef;
    timeoutRefDonut;

    constructor(
        private httpClient: HttpClientService,
        private singletonService: SingletonService
    ) {
      
    }

    // startPolling() {
    //     this.getEdgeNodeMetrics();
    //     this.polling(true);
    // }

    // polling(token){
    //     this.timeoutRef = setTimeout(() => {
    //         this.getNodeConfig();
    //         this.getEdgeNodeMetrics();
    //         if(token){
    //             this.polling(true);
    //         }
    //     }, 5000);
    // }


    // stopPolling() {
    //     if (this.timeoutRef) {
    //         clearTimeout(this.timeoutRef);
    //     }
    // }

}