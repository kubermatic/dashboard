import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ClusterSSHKeysComponent } from './cluster-ssh-keys.component';
import { ApiService, ProjectService, WizardService, UserService } from '../../../core/services';
import { AppConfigService } from './../../../app-config.service';
import { SharedModule } from '../../../shared/shared.module';
import { asyncData } from '../../../testing/services/api-mock.service';
import { ProjectMockService } from '../../../testing/services/project-mock.service';
import { UserMockService } from './../../../testing/services/user-mock.service';
import { AppConfigMockService } from './../../../testing/services/app-config-mock.service';
import { fakeDigitaloceanCluster } from '../../../testing/fake-data/cluster.fake';
import { fakeSSHKeys } from '../../../testing/fake-data/sshkey.fake';

describe('ClusterSSHKeys', () => {
  let fixture: ComponentFixture<ClusterSSHKeysComponent>;
  let component: ClusterSSHKeysComponent;

  beforeEach(async(() => {
    const apiMock = jasmine.createSpyObj('ApiService', ['getSSHKeys']);
    apiMock.getSSHKeys.and.returnValue(asyncData(fakeSSHKeys()));

    TestBed.configureTestingModule({
      imports: [
        BrowserModule,
        BrowserAnimationsModule,
        ReactiveFormsModule,
        SharedModule
      ],
      declarations: [
        ClusterSSHKeysComponent
      ],
      providers: [
        WizardService,
        { provide: ApiService, useValue: apiMock },
        { provide: ProjectService, useClass: ProjectMockService },
        { provide: UserService, useClass: UserMockService },
        { provide: AppConfigService, useClass: AppConfigMockService}
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClusterSSHKeysComponent);
    component = fixture.componentInstance;
    component.cluster = fakeDigitaloceanCluster();
    component.selectedKeys = [];
    fixture.detectChanges();
  });

  it('should create the ssh-key-form-field cmp', () => {
    expect(component).toBeTruthy();
  });

  it('no ssh keys are required', () => {
    expect(component.keysForm.controls.keys.hasError('required')).toBeFalsy('no keys are required');
  });
});
