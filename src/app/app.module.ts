import { NgModule, APP_INITIALIZER } from '@angular/core';
import { RouterModule } from '@angular/router';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgReduxModule } from '@angular-redux/store';
import { NgReduxFormModule } from '@angular-redux/form';
import { KubermaticComponent } from './kubermatic.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { MobileNavigationComponent } from './overlays';
import { AddProjectComponent } from './add-project/add-project.component';
import { AddMemberComponent } from './member/add-member/add-member.component';
import { EditMemberComponent } from './member/edit-member/edit-member.component';
import { AppRoutingModule } from './app-routing.module';
import { SharedModule } from './shared/shared.module';
import { CoreModule } from './core/core.module';
import { AppConfigService } from './app-config.service';
import { ProjectService } from './core/services/project/project.service';
import { UserService } from './core/services/user/user.service';
import { GoogleAnalyticsService } from './google-analytics.service';

const appInitializerFn = (appConfig: AppConfigService) => {
  return () => {
    appConfig.loadAppConfig();
    appConfig.loadUserGroupConfig();
  };
};

@NgModule({
  imports: [
    CoreModule,
    SharedModule,
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    NgReduxFormModule,
    NgReduxModule,
    RouterModule
  ],
  declarations: [
    KubermaticComponent,
    DashboardComponent,
    MobileNavigationComponent
  ],
  providers: [
    AppConfigService,
    {
      provide: APP_INITIALIZER,
      useFactory: appInitializerFn,
      multi: true,
      deps: [AppConfigService]
    },
    ProjectService,
    UserService,
    GoogleAnalyticsService
  ],
  entryComponents: [
    MobileNavigationComponent,
    AddProjectComponent,
    AddMemberComponent,
    EditMemberComponent
  ],
  bootstrap: [KubermaticComponent]
})

export class AppModule {
}
