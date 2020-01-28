import {async, ComponentFixture, fakeAsync, flush, TestBed, tick} from '@angular/core/testing';
import {MatDialog} from '@angular/material/dialog';
import {MatTabsModule} from '@angular/material/tabs';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {ActivatedRoute, Router} from '@angular/router';
import {of} from 'rxjs';

import {AppConfigService} from '../app-config.service';
import {ApiService, NotificationService, ProjectService, UserService} from '../core/services';
import {SettingsService} from '../core/services/settings/settings.service';
import {GoogleAnalyticsService} from '../google-analytics.service';
import {SharedModule} from '../shared/shared.module';
import {DialogTestModule, NoopConfirmDialogComponent} from '../testing/components/noop-confirmation-dialog.component';
import {fakeProject} from '../testing/fake-data/project.fake';
import {fakeSSHKeys} from '../testing/fake-data/sshkey.fake';
import {ActivatedRouteStub, RouterStub, RouterTestingModule} from '../testing/router-stubs';
import {asyncData} from '../testing/services/api-mock.service';
import {AppConfigMockService} from '../testing/services/app-config-mock.service';
import {ProjectMockService} from '../testing/services/project-mock.service';
import {SettingsMockService} from '../testing/services/settings-mock.service';
import {UserMockService} from '../testing/services/user-mock.service';

import {SSHKeyComponent} from './sshkey.component';


describe('SSHKeyComponent', () => {
  let fixture: ComponentFixture<SSHKeyComponent>;
  let noop: ComponentFixture<NoopConfirmDialogComponent>;
  let component: SSHKeyComponent;
  let activatedRoute: ActivatedRouteStub;
  let deleteSSHKeySpy;

  beforeEach(async(() => {
    const apiMock = {'getSSHKeys': jest.fn(), 'deleteSSHKey': jest.fn()};
    apiMock.getSSHKeys.mockReturnValue(asyncData(fakeSSHKeys()));
    deleteSSHKeySpy = apiMock.deleteSSHKey.mockReturnValue(of(null));

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
            SSHKeyComponent,
          ],
          providers: [
            {provide: Router, useClass: RouterStub},
            {provide: ApiService, useValue: apiMock},
            {provide: UserService, useClass: UserMockService},
            {provide: AppConfigService, useClass: AppConfigMockService},
            {provide: ActivatedRoute, useClass: ActivatedRouteStub},
            {provide: ProjectService, useClass: ProjectMockService},
            {provide: SettingsService, useClass: SettingsMockService},
            MatDialog,
            GoogleAnalyticsService,
            NotificationService,
          ],
        })
        .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SSHKeyComponent);
    component = fixture.componentInstance;
    noop = TestBed.createComponent(NoopConfirmDialogComponent);

    activatedRoute = fixture.debugElement.injector.get(ActivatedRoute) as any;
    activatedRoute.testParamMap = {projectID: '4k6txp5sq'};

    fixture.detectChanges();
    fixture.debugElement.injector.get(Router);
  });

  it('should initialize', () => {
    expect(component).toBeTruthy();
  });

  it('should open delete ssh key confirmation dialog & call deleteSshKey()', fakeAsync(() => {
       component.projectID = fakeProject().id;
       component.sshKeys = fakeSSHKeys();
       const event = new MouseEvent('click');

       component.deleteSshKey(component.sshKeys[0], event);

       fixture.detectChanges();
       noop.detectChanges();
       tick(15000);

       const dialogTitle = document.body.querySelector('.mat-dialog-title');
       const deleteButton = document.body.querySelector('#km-confirmation-dialog-confirm-btn') as HTMLInputElement;

       expect(dialogTitle.textContent).toBe('Delete SSH Key');
       expect(deleteButton.textContent).toBe(' Delete ');

       deleteButton.click();

       noop.detectChanges();
       fixture.detectChanges();
       tick(15000);

       expect(deleteSSHKeySpy).toHaveBeenCalled();
       fixture.destroy();
       flush();
     }));
});
