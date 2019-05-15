import {async, ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {MatDialog, MatTabsModule} from '@angular/material';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {Router} from '@angular/router';
import {SlimLoadingBarModule} from 'ng2-slim-loading-bar';
import {of} from 'rxjs';
import Spy = jasmine.Spy;

import {AppConfigService} from '../app-config.service';
import {ApiService, ProjectService, UserService} from '../core/services';
import {GoogleAnalyticsService} from '../google-analytics.service';
import {SharedModule} from '../shared/shared.module';
import {DialogTestModule, NoopConfirmDialogComponent} from '../testing/components/noop-confirmation-dialog.component';
import {fakeServiceAccounts, fakeServiceAccountTokens} from '../testing/fake-data/serviceaccount.fake';
import {RouterStub, RouterTestingModule} from '../testing/router-stubs';
import {asyncData} from '../testing/services/api-mock.service';
import {AppConfigMockService} from '../testing/services/app-config-mock.service';
import {ProjectMockService} from '../testing/services/project-mock.service';
import {UserMockService} from '../testing/services/user-mock.service';
import {ServiceAccountTokenComponent} from './serviceaccount-token/serviceaccount-token.component';
import {ServiceAccountComponent} from './serviceaccount.component';

describe('ServiceAccountComponent', () => {
  let fixture: ComponentFixture<ServiceAccountComponent>;
  let noop: ComponentFixture<NoopConfirmDialogComponent>;
  let component: ServiceAccountComponent;
  let deleteServiceAccountSpy: Spy;

  beforeEach(async(() => {
    const apiMock =
        jasmine.createSpyObj('ApiService', ['getServiceAccounts', 'getServiceAccountTokens', 'deleteServiceAccount']);
    apiMock.getServiceAccounts.and.returnValue(asyncData(fakeServiceAccounts()));
    apiMock.getServiceAccountTokens.and.returnValue(asyncData(fakeServiceAccountTokens()));
    deleteServiceAccountSpy = apiMock.deleteServiceAccount.and.returnValue(of(null));

    TestBed
        .configureTestingModule({
          imports: [
            BrowserModule,
            BrowserAnimationsModule,
            SlimLoadingBarModule.forRoot(),
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
            MatDialog,
            GoogleAnalyticsService,
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
    expect(component.getStateIconClass('Active')).toBe('fa fa-circle green');
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

       expect(dialogTitle.textContent).toBe('Remove Service Account from project');
       expect(deleteButton.textContent).toBe(' Delete ');

       deleteButton.click();

       noop.detectChanges();
       fixture.detectChanges();
       tick(15000);

       expect(deleteServiceAccountSpy.and.callThrough()).toHaveBeenCalled();
     }));
});
