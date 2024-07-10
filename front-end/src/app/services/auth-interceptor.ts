
import { HttpInterceptor, HttpHandler, HttpRequest } from "@angular/common/http";
import { SingletonService } from './singleton.service';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpEvent } from '@angular/common/http';
import { UserService } from './user.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    constructor(
        private ss: SingletonService,
        private user: UserService
    ) {

    }
    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        // console.log("adding authorization header", this.user.getToken());
        let token = this.user.getToken();
        if (token) {
            let clone = req.clone({ headers: req.headers.set('Authorization', 'Bearer ' + this.user.getToken()) }); 
            return next.handle(clone);
        } else {
            return next.handle(req);
        }
        //  return next.handle(req);
    }
}