import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import { MatDialog, MatDialogRef } from '@angular/material';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { AddClusterSSHKeysComponent } from './add-cluster-sshkeys.component';
import { ApiService, ProjectService, UserService } from './../../../../core/services';
import { AppConfigService } from './../../../../app-config.service';
import { SharedModule } from './../../../../shared/shared.module';
import { MatDialogRefMock } from './../../../../testing/services/mat-dialog-ref-mock';
import { ProjectMockService } from './../../../../testing/services/project-mock.service';
import { UserMockService } from './../../../../testing/services/user-mock.service';
import { AppConfigMockService } from './../../../../testing/services/app-config-mock.service';
import { asyncData } from './../../../../testing/services/api-mock.service';
import { fakeSSHKeys } from './../../../../testing/fake-data/sshkey.fake';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SlimLoadingBarModule.forRoot(),
  SharedModule
];

describe('AddClusterSSHKeysComponent', () => {
  let fixture: ComponentFixture<AddClusterSSHKeysComponent>;
  let component: AddClusterSSHKeysComponent;

  beforeEach(async(() => {
    const apiMock = jasmine.createSpyObj('ApiService', ['getSSHKeys', 'addClusterSSHKey']);
    apiMock.getSSHKeys.and.returnValue(asyncData(fakeSSHKeys()));
    apiMock.addClusterSSHKey.and.returnValue(asyncData(fakeSSHKeys()[0]));

    TestBed.configureTestingModule({
      imports: [
        ...modules,
      ],
      declarations: [
        AddClusterSSHKeysComponent
      ],
      providers: [
        { provide: MatDialogRef, useClass: MatDialogRefMock },
        { provide: ApiService, useValue: apiMock },
        { provide: ProjectService, useClass: ProjectMockService },
        { provide: UserService, useClass: UserMockService },
        { provide: AppConfigService, useClass: AppConfigMockService},
        MatDialog
      ],
    }).compileComponents();
  }));

  beforeEach(async(() => {
    fixture = TestBed.createComponent(AddClusterSSHKeysComponent);
    component = fixture.componentInstance;
  }));

  it('should create the add cluster sshkeys component', async(() => {
    expect(component).toBeTruthy();
  }));
});
