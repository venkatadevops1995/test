import {
    CanActivate,
    CanActivateChild,
    ActivatedRouteSnapshot,
    RouterStateSnapshot,
    Router
} from "@angular/router";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { SingletonService } from "./singleton.service";
import { UserService } from "./user.service";

@Injectable()
export class AuthGuardService implements CanActivate, CanActivateChild {
    constructor(
        private ss: SingletonService,
        private router: Router,
        private user: UserService
    ) { }

    canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Observable<boolean> | Promise<boolean> | boolean {
        let isValid = this.user.validateSession()
        if (isValid) {
            return true;
        } else {
            this.router.navigate(["/login"], {
                //   queryParams: { emailId: this.user.getUserEmail() }
            });
            this.user.resetSession();
            return false;
        }
    }

    canActivateChild(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Observable<boolean> | Promise<boolean> | boolean {
        return this.canActivate(route, state);
    }
}