import { NgModule } from "@angular/core";
import { ObjectToKVArrayPipe } from "./objectToArray.pipe";
import { KeysPipe } from "./objectToKeys.pipe";

@NgModule({
    declarations: [ObjectToKVArrayPipe, KeysPipe],
    exports: [ObjectToKVArrayPipe, KeysPipe]
})
export class PipesModule {
}