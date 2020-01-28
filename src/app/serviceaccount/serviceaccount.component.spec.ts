import {async, ComponentFixture, fakeAsync, flush, TestBed, tick} from '@angular/core/testing';
import {MatDialog} from '@angular/material/dialog';
import {MatTabsModule} from '@angular/material/tabs';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {Router} from '@angular/router';
import {of} from 'rxjs';

import {AppConfigService} from '../app-config.service';
import {ApiService, NotificationService, ProjectService, UserService} from '../core/services';
import {SettingsService} from '../core/services/settings/settings.service';
import {GoogleAnalyticsService} from '../google-analytics.service';
import {SharedModule} from '../shared/shared.module';
import {HealthStatusColor} from '../shared/utils/health-status/health-status';
import {DialogTestModule, NoopConfirmDialogComponent} from '../testing/components/noop-confirmation-dialog.component';
import {fakeServiceAccounts, fakeServiceAccountTokens} from '../testing/fake-data/serviceaccount.fake';
import {RouterStub, RouterTestingModule} from '../testing/router-stubs';
import {asyncData} from '../testing/services/api-mock.service';
import {AppConfigMockService} from '../testing/services/app-config-mock.service';
import {ProjectMockService} from '../testing/services/project-mock.service';
import {SettingsMockService} from '../testing/services/settings-mock.service';
import {UserMockService} from '../testing/services/user-mock.service';

import {ServiceAccountTokenComponent} from './serviceaccount-token/serviceaccount-token.component';
import {ServiceAccountComponent} from './serviceaccount.component';

describe('ServiceAccountComponent', () => {
  let fixture: ComponentFixture<ServiceAccountComponent>;
  let noop: ComponentFixture<NoopConfirmDialogComponent>;
  let component: ServiceAccountComponent;
  let deleteServiceAccountSpy;

  beforeEach(async(() => {
    const apiMock = {
      'getServiceAccounts': jest.fn(),
      'getServiceAccountTokens': jest.fn(),
      'deleteServiceAccount': jest.fn()
    };
    apiMock.getServiceAccounts.mockReturnValue(asyncData(fakeServiceAccounts()));
    apiMock.getServiceAccountTokens.mockReturnValue(asyncData(fakeServiceAccountTokens()));
    deleteServiceAccountSpy = apiMock.deleteServiceAccount.mockReturnValue(of(null));

    TestBed
        .configureTestingModule({
          imports: [
            BrowserModule,
            BrowserAnimationsModule,
            RouterTestingModule,
            SharedModule,
            MatTabsModule,
            DialogTestModule,
          ],
          declarations: [
            ServiceAccountComponent,
            ServiceAccountTokenComponent,
          ],
          providers: [
            {provide: Router, useClass: RouterStub},
            {provide: ApiService, useValue: apiMock},
            {provide: ProjectService, useClass: ProjectMockService},
            {provide: UserService, useClass: UserMockService},
            {provide: AppConfigService, useClass: AppConfigMockService},
            {provide: SettingsService, useClass: SettingsMockService},
            MatDialog,
            GoogleAnalyticsService,
            NotificationService,
          ],
        })
        .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ServiceAccountComponent);
    component = fixture.componentInstance;
    noop = TestBed.createComponent(NoopConfirmDialogComponent);
    component.tokenList = fakeServiceAccountTokens();
    fixture.detectChanges();
    fixture.debugElement.injector.get(Router);
  });

  it('should create service accounts cmp', () => {
    expect(component).toBeTruthy();
  });

  it('should get correct state icon class', () => {
    expect(component.getStateIconClass('Active')).toBe(HealthStatusColor.Green);
  });

  it('should get correct group display name', () => {
    expect(component.getGroupDisplayName('editors')).toBe('Editor');
  });

  it('should open delete service account confirmation dialog & call deleteServiceAccount()', fakeAsync(() => {
       const event = new MouseEvent('click');
       component.deleteServiceAccount(fakeServiceAccounts()[0], event);
       noop.detectChanges();
       tick(15000);

       const dialogTitle = document.body.querySelector('.mat-dialog-title');
       const deleteButton = document.body.querySelector('#km-confirmation-dialog-confirm-btn') as HTMLInputElement;

       expect(dialogTitle.textContent).toBe('Delete Service Account');
       expect(deleteButton.textContent).toBe(' Delete ');

       deleteButton.click();

       noop.detectChanges();
       fixture.detectChanges();
       tick(15000);

       expect(deleteServiceAccountSpy).toHaveBeenCalled();
       fixture.destroy();
       flush();
     }));
});
