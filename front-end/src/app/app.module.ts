import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { HttpClientService } from './services/http-client.service';
import { UserService } from './services/user.service';
import { AuthGuardService } from './services/auth-guard.service';
import { WindowReferenceService } from './services/window-reference.service';
import { SingletonService } from './services/singleton.service';
import { AnimationsService } from './services/animations.service';
import { XhrProgressService } from './services/xhr-progress.service';
import { DatePipe } from '@angular/common';
import { AuthInterceptor } from './services/auth-interceptor';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http'; 
import { ConfirmDialogModule } from './components/confirm-dialog/confirm-dialog.module';
import { LoaderComponent } from './components/loader/loader.component';
import { StatusMessageComponent } from './components/status-message/status-message.component';
import { ProgressBarComponent } from './components/progress-bar/progress-bar.component';
import { SvgComponent } from './layout/svg/svg.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations'
import { HeaderComponent } from './layout/header/header.component';
import { FooterComponent } from './layout/footer/footer.component';
import { HeaderSearchModule } from './components/header-search/header-search.module'; 
import { ButtonModule } from './components/button/button.module'; 
import { ModalPopupModule } from './components/modal-popup/modal-popup.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FileDownloadModule } from './directives/file-download/file-download.module';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select'; 
import { AddProjectComponent } from './view-modules/common/add-project/add-project.component';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatRadioModule} from '@angular/material/radio';
import {MatDialogModule} from '@angular/material/dialog';
import { UseSvgModule } from './components/use-svg/use-svg.module';
import { FocusModule } from './directives/focuseDirective/focus/focus.module';



@NgModule({
  declarations: [
    AppComponent,
    LoaderComponent,
    StatusMessageComponent,
    ProgressBarComponent,
    SvgComponent,
    HeaderComponent,
    FooterComponent ,
    AddProjectComponent,
    SidebarComponent,
  
  
  ],
  imports: [
    BrowserModule, 
    BrowserAnimationsModule,
    HttpClientModule,
    ConfirmDialogModule,
    AppRoutingModule,
    HeaderSearchModule, 
    ButtonModule, 
    ModalPopupModule,
    FormsModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    FileDownloadModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    // MatSlideToggleModule, 
    MatSelectModule,
    MatDatepickerModule,
    MatRadioModule,
    MatDialogModule,
    UseSvgModule,
    FocusModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production,
      // Register the ServiceWorker as soon as the app is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000'
    }),
    MatSlideToggleModule 
  ],
  providers: [
    HttpClientService,
    UserService,
    AuthGuardService,
    WindowReferenceService,
    SingletonService,
    AnimationsService,
    XhrProgressService,
    DatePipe,
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
