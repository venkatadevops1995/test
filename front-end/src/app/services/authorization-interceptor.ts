
// import { UserService } from './user.service';
// import { HttpInterceptor, HttpHandler, HttpRequest } from "@angular/common/http";
// import { SingletonService } from './singleton.service';
// import { Injectable } from '@angular/core';
// import { Observable } from 'rxjs/Observable';
// import { HttpEvent } from '@angular/common/http';

// @Injectable()
// export class AuthInterceptor implements HttpInterceptor {
//     constructor(
//         private user: UserService,
//         private ss: SingletonService
//     ) {

//     }
//     intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
//         if (!this.ss.isPreSignIn) {
//             // console.log("adding authorization header", this.user.getToken());
//             let token = this.user.getToken();
//             if (token) {
//                 let clone = req.clone({ headers: req.headers.set('Authorization', this.user.getToken()) });
//                 return next.handle(clone);
//             } else {
//                 return next.handle(req);
//             }
//         } else {
//             return next.handle(req);
//         } 
//     }
// }