import {async, ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {MatDialog} from '@angular/material';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {SlimLoadingBarModule} from 'ng2-slim-loading-bar';
import {of} from 'rxjs';
import Spy = jasmine.Spy;

import {AppConfigService} from '../../../../app-config.service';
import {ApiService, UserService} from '../../../../core/services';
import {GoogleAnalyticsService} from '../../../../google-analytics.service';
import {SharedModule} from '../../../../shared/shared.module';
import {DialogTestModule, NoopConfirmDialogComponent} from '../../../../testing/components/noop-confirmation-dialog.component';
import {fakeDigitaloceanCluster} from '../../../../testing/fake-data/cluster.fake';
import {fakeDigitaloceanDatacenter} from '../../../../testing/fake-data/datacenter.fake';
import {fakeSSHKeys} from '../../../../testing/fake-data/sshkey.fake';
import {fakeProject} from '../../../../testing/fake-data/project.fake';
import {AppConfigMockService} from '../../../../testing/services/app-config-mock.service';
import {UserMockService} from '../../../../testing/services/user-mock.service';
import {EditSSHKeysItemComponent} from './edit-sshkeys-item.component';

describe('EditSSHKeysItemComponent', () => {
  let fixture: ComponentFixture<EditSSHKeysItemComponent>;
  let noop: ComponentFixture<NoopConfirmDialogComponent>;
  let component: EditSSHKeysItemComponent;
  let deleteClusterSSHKeySpy: Spy;

  beforeEach(async(() => {
    const apiMock = jasmine.createSpyObj('ApiService', ['deleteClusterSSHKey']);
    deleteClusterSSHKeySpy = apiMock.deleteClusterSSHKey.and.returnValue(of(null));

    TestBed
        .configureTestingModule({
          imports: [
            BrowserModule,
            BrowserAnimationsModule,
            SlimLoadingBarModule.forRoot(),
            SharedModule,
            DialogTestModule,
          ],
          declarations: [
            EditSSHKeysItemComponent,
          ],
          providers: [
            MatDialog,
            {provide: ApiService, useValue: apiMock},
            {provide: UserService, useClass: UserMockService},
            {provide: AppConfigService, useClass: AppConfigMockService},
            GoogleAnalyticsService,
          ],
        })
        .compileComponents();
  }));

  beforeEach(async(() => {
    fixture = TestBed.createComponent(EditSSHKeysItemComponent);
    component = fixture.componentInstance;
    noop = TestBed.createComponent(NoopConfirmDialogComponent);
  }));

  it('should create the edit sshkeys item component', async(() => {
       expect(component).toBeTruthy();
     }));

  it('should open delete cluster ssh key confirmation dialog & call deleteSshKey()', fakeAsync(() => {
       component.cluster = fakeDigitaloceanCluster();
       component.datacenter = fakeDigitaloceanDatacenter();
       component.projectID = fakeProject().id;
       component.sshKey = fakeSSHKeys()[0];
       fixture.detectChanges();

       component.deleteSshKey();
       noop.detectChanges();
       tick(15000);

       const dialogTitle = document.body.querySelector('.mat-dialog-title');
       const deleteButton = document.body.querySelector('#km-confirmation-dialog-confirm-btn') as HTMLInputElement;

       expect(dialogTitle.textContent).toBe('Remove SSH key from cluster');
       expect(deleteButton.textContent).toBe(' Delete ');

       deleteButton.click();

       noop.detectChanges();
       fixture.detectChanges();
       tick(15000);

       expect(deleteClusterSSHKeySpy.and.callThrough()).toHaveBeenCalled();
     }));
});
