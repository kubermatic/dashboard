import { NgModule, APP_INITIALIZER } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgReduxModule } from '@angular-redux/store';
import { NgReduxFormModule } from '@angular-redux/form';
import { KubermaticComponent } from './kubermatic.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { MobileNavigationComponent } from './overlays';
import { AppRoutingModule } from './app-routing.module';
import { SharedModule } from './shared/shared.module';
import { CoreModule } from './core/core.module';
import { AppConfigService } from './app-config.service';
import { GoogleAnalyticsService } from './google-analytics.service';

const appInitializerFn = (appConfig: AppConfigService) => {
  return () => {
    return appConfig.loadAppConfig();
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
    NgReduxModule
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
    GoogleAnalyticsService
  ],
  entryComponents: [
    MobileNavigationComponent
  ],
  bootstrap: [KubermaticComponent]
})

export class AppModule {
}
