import {async, ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {MatDialog} from '@angular/material';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {Router} from '@angular/router';
import {SlimLoadingBarModule} from 'ng2-slim-loading-bar';
import {of} from 'rxjs';
import Spy = jasmine.Spy;

import {AppConfigService} from '../../app-config.service';
import {ApiService, ProjectService} from '../../core/services';
import {GoogleAnalyticsService} from '../../google-analytics.service';
import {SharedModule} from '../../shared/shared.module';
import {DialogTestModule, NoopConfirmDialogComponent} from '../../testing/components/noop-confirmation-dialog.component';
import {NoopTokenDialogComponent, TokenDialogTestModule} from '../../testing/components/noop-token-dialog.component';
import {fakeServiceAccount, fakeServiceAccountTokens} from '../../testing/fake-data/serviceaccount.fake';
import {RouterStub, RouterTestingModule} from '../../testing/router-stubs';
import {asyncData} from '../../testing/services/api-mock.service';
import {AppConfigMockService} from '../../testing/services/app-config-mock.service';
import {ProjectMockService} from '../../testing/services/project-mock.service';
import {ServiceAccountTokenComponent} from './serviceaccount-token.component';
import {TokenDialogComponent} from './token-dialog/token-dialog.component';


describe('ServiceAccountTokenComponent', () => {
  let fixture: ComponentFixture<ServiceAccountTokenComponent>;
  let noop: ComponentFixture<NoopConfirmDialogComponent>;
  let noopToken: ComponentFixture<NoopTokenDialogComponent>;
  let component: ServiceAccountTokenComponent;
  let regenerateServiceAccountTokenSpy: Spy;
  let deleteServiceAccountTokenSpy: Spy;

  beforeEach(async(() => {
    const apiMock = jasmine.createSpyObj('ApiService', ['regenerateServiceAccountToken', 'deleteServiceAccountToken']);
    regenerateServiceAccountTokenSpy =
        apiMock.regenerateServiceAccountToken.and.returnValue(asyncData(fakeServiceAccountTokens()));
    deleteServiceAccountTokenSpy = apiMock.deleteServiceAccountToken.and.returnValue(of(null));

    TestBed
        .configureTestingModule({
          imports: [
            BrowserModule,
            BrowserAnimationsModule,
            SlimLoadingBarModule.forRoot(),
            RouterTestingModule,
            SharedModule,
            DialogTestModule,
            TokenDialogTestModule,
          ],
          declarations: [
            ServiceAccountTokenComponent,
            TokenDialogComponent,
          ],
          providers: [
            {provide: Router, useClass: RouterStub},
            {provide: ApiService, useValue: apiMock},
            {provide: ProjectService, useClass: ProjectMockService},
            {provide: AppConfigService, useClass: AppConfigMockService},
            MatDialog,
            GoogleAnalyticsService,
          ],
        })
        .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ServiceAccountTokenComponent);
    component = fixture.componentInstance;
    noop = TestBed.createComponent(NoopConfirmDialogComponent);
    noopToken = TestBed.createComponent(NoopTokenDialogComponent);
    component.serviceaccountTokens = fakeServiceAccountTokens();
    component.serviceaccount = fakeServiceAccount();
    component.isInitializing = false;
    fixture.detectChanges();
    fixture.debugElement.injector.get(Router);
  });

  it('should create service account token cmp', () => {
    expect(component).toBeTruthy();
  });

  it('should open regenerate service account token dialog & call regenerateServiceAccountToken()', fakeAsync(() => {
       component.regenerateServiceAccountToken(fakeServiceAccountTokens()[0]);
       noop.detectChanges();
       tick(15000);

       const dialogTitle = document.body.querySelector('.km-dialog-title');
       const cancelButton = document.body.querySelector('#km-confirmation-dialog-cancel-btn');
       const regenerateButton = document.body.querySelector('#km-confirmation-dialog-confirm-btn') as HTMLInputElement;

       expect(dialogTitle.textContent).toBe('Regenerate Token for Service Account');
       expect(cancelButton.textContent).toBe(' Close ');
       expect(regenerateButton.textContent).toBe(' Regenerate ');

       regenerateButton.click();

       noop.detectChanges();
       fixture.detectChanges();
       tick(15000);

       expect(regenerateServiceAccountTokenSpy.and.callThrough()).toHaveBeenCalled();
     }));

  it('should open delete service account token dialog & call deleteServiceAccountToken()', fakeAsync(() => {
       component.deleteServiceAccountToken(fakeServiceAccountTokens()[0]);
       noop.detectChanges();
       tick(15000);

       const dialogTitle = document.body.querySelector('.km-dialog-title');
       const cancelButton = document.body.querySelector('#km-confirmation-dialog-cancel-btn');
       const deleteButton = document.body.querySelector('#km-confirmation-dialog-confirm-btn') as HTMLInputElement;

       expect(dialogTitle.textContent).toBe('Remove Token from Service Account');
       expect(cancelButton.textContent).toBe(' Close ');
       expect(deleteButton.textContent).toBe(' Delete ');

       deleteButton.click();

       noop.detectChanges();
       noopToken.detectChanges();
       fixture.detectChanges();
       tick(15000);

       expect(deleteServiceAccountTokenSpy.and.callThrough()).toHaveBeenCalled();
     }));
});
