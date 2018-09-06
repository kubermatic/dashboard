import { ApiService } from './../../../core/services/api/api.service';
import { SharedModule } from '../../../shared/shared.module';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { asyncData } from '../../../testing/services/api-mock.service';
import { ReactiveFormsModule } from '@angular/forms';
import { ClusterSSHKeysComponent } from './cluster-ssh-keys.component';
import { WizardService } from '../../../core/services/wizard/wizard.service';
import { fakeDigitaloceanCluster } from '../../../testing/fake-data/cluster.fake';
import { fakeSSHKeys } from '../../../testing/fake-data/sshkey.fake';
import Spy = jasmine.Spy;
import { ProjectService } from '../../../core/services';
import { ProjectMockService } from '../../../testing/services/project-mock.service';

describe('ClusterSSHKeys', () => {
  let fixture: ComponentFixture<ClusterSSHKeysComponent>;
  let component: ClusterSSHKeysComponent;
  let getSSHKeysSpy: Spy;

  beforeEach(async(() => {
    const apiMock = jasmine.createSpyObj('ApiService', ['getSSHKeys']);
    getSSHKeysSpy = apiMock.getSSHKeys.and.returnValue(asyncData(fakeSSHKeys()));

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
