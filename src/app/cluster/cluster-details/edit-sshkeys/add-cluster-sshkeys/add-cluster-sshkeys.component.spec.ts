import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {MatDialog, MatDialogRef} from '@angular/material';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {SlimLoadingBarModule} from 'ng2-slim-loading-bar';
import {AppConfigService} from '../../../../app-config.service';
import {ApiService, ClusterService, ProjectService, UserService} from '../../../../core/services';
import {SharedModule} from '../../../../shared/shared.module';
import {ApiMockService} from '../../../../testing/services/api-mock.service';
import {AppConfigMockService} from '../../../../testing/services/app-config-mock.service';
import {ClusterMockService} from '../../../../testing/services/cluster-mock-service';
import {MatDialogRefMock} from '../../../../testing/services/mat-dialog-ref-mock';
import {ProjectMockService} from '../../../../testing/services/project-mock.service';
import {UserMockService} from '../../../../testing/services/user-mock.service';
import {AddClusterSSHKeysComponent} from './add-cluster-sshkeys.component';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SlimLoadingBarModule.forRoot(),
  SharedModule,
];

describe('AddClusterSSHKeysComponent', () => {
  let fixture: ComponentFixture<AddClusterSSHKeysComponent>;
  let component: AddClusterSSHKeysComponent;

  beforeEach(async(() => {
    TestBed
        .configureTestingModule({
          imports: [
            ...modules,
          ],
          declarations: [
            AddClusterSSHKeysComponent,
          ],
          providers: [
            {provide: MatDialogRef, useClass: MatDialogRefMock},
            {provide: ApiService, useValue: ApiMockService},
            {provide: ClusterService, useClass: ClusterMockService},
            {provide: ProjectService, useClass: ProjectMockService},
            {provide: UserService, useClass: UserMockService},
            {provide: AppConfigService, useClass: AppConfigMockService},
            MatDialog,
          ],
        })
        .compileComponents();
  }));

  beforeEach(async(() => {
    fixture = TestBed.createComponent(AddClusterSSHKeysComponent);
    component = fixture.componentInstance;
  }));

  it('should create the add cluster sshkeys component', async(() => {
       expect(component).toBeTruthy();
     }));
});
