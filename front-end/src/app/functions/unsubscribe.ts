import { Subscription } from 'rxjs';
import * as _ from 'lodash';

export type Subscriptions = {
    [propName: string]: Subscription
}
export interface UnSubscribeOnDestroy {
    subscriptions: Subscriptions,
    ngOnDestroy(...a): void;
}
export function UnSubscribe(target: any, methodName: string, propertyDescriptor: PropertyDescriptor) {
    const originalMethod = propertyDescriptor.value;
    if (methodName === "ngOnDestroy") {
        propertyDescriptor.value = function () {
            // to avoid memory leaks and view destroyed errors
            if (this.subscriptions) {
                _.forIn(this.subscriptions, (val, key) => {
                    if (this.subscriptions[key] instanceof Subscription) {
                        this.subscriptions[key].unsubscribe();
                    } else {
                        console.warn("Encountered entries in subscriptions object which are not of type Subscriptions")
                    }
                })
            }
            // console.log(Array.from(arguments));
            originalMethod.apply(this,arguments);
        };
    }
}