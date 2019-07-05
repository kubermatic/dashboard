import {HttpClientModule} from '@angular/common/http';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {ReactiveFormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {ActivatedRoute, Router} from '@angular/router';
import {AppConfigService} from '../../../app-config.service';
import {ApiService, ProjectService, UserService, WizardService} from '../../../core/services';
import {SharedModule} from '../../../shared/shared.module';
import {fakeDigitaloceanCluster} from '../../../testing/fake-data/cluster.fake';
import {fakeSSHKeys} from '../../../testing/fake-data/sshkey.fake';
import {RouterStub} from '../../../testing/router-stubs';
import {ActivatedRouteMock} from '../../../testing/services/activate-route-mock';
import {asyncData} from '../../../testing/services/api-mock.service';
import {AppConfigMockService} from '../../../testing/services/app-config-mock.service';
import {ProjectMockService} from '../../../testing/services/project-mock.service';
import {UserMockService} from '../../../testing/services/user-mock.service';
import {ClusterSSHKeysComponent} from './cluster-ssh-keys.component';

describe('ClusterSSHKeys', () => {
  let fixture: ComponentFixture<ClusterSSHKeysComponent>;
  let component: ClusterSSHKeysComponent;

  beforeEach(async(() => {
    const apiMock = jasmine.createSpyObj('ApiService', ['getSSHKeys']);
    apiMock.getSSHKeys.and.returnValue(asyncData(fakeSSHKeys()));

    TestBed
        .configureTestingModule({
          imports: [
            BrowserModule,
            BrowserAnimationsModule,
            ReactiveFormsModule,
            SharedModule,
            HttpClientModule,
          ],
          declarations: [
            ClusterSSHKeysComponent,
          ],
          providers: [
            WizardService,
            {provide: ActivatedRoute, useClass: ActivatedRouteMock},
            {provide: ApiService, useValue: apiMock},
            {provide: ProjectService, useClass: ProjectMockService},
            {provide: UserService, useClass: UserMockService},
            {provide: AppConfigService, useClass: AppConfigMockService},
            {provide: Router, useClass: RouterStub},
          ],
        })
        .compileComponents();
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
