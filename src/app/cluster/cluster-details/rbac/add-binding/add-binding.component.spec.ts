import {async, ComponentFixture, discardPeriodicTasks, fakeAsync, TestBed} from '@angular/core/testing';
import {MatDialogRef} from '@angular/material';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

import {CoreModule} from '../../../../core/core.module';
import {RBACService} from '../../../../core/services';
import {SharedModule} from '../../../../shared/shared.module';
import {fakeDigitaloceanCluster} from '../../../../testing/fake-data/cluster.fake';
import {fakeDigitaloceanDatacenter} from '../../../../testing/fake-data/datacenter.fake';
import {fakeProject} from '../../../../testing/fake-data/project.fake';
import {fakeBinding, fakeClusterBinding, fakeClusterRoleNames, fakeRoleNames} from '../../../../testing/fake-data/rbac.fake';
import {asyncData} from '../../../../testing/services/api-mock.service';
import {MatDialogRefMock} from '../../../../testing/services/mat-dialog-ref-mock';

import {AddBindingComponent} from './add-binding.component';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SharedModule,
  CoreModule,
];

describe('AddBindingComponent', () => {
  let fixture: ComponentFixture<AddBindingComponent>;
  let component: AddBindingComponent;

  beforeEach(async(() => {
    const rbacMock = {
      'getClusterRoleNames': jest.fn(),
      'getRoleNames': jest.fn(),
      'createClusterBinding': jest.fn(),
      'createBinding': jest.fn(),
    };

    rbacMock.getClusterRoleNames.mockReturnValue(asyncData([fakeClusterRoleNames()]));
    rbacMock.getRoleNames.mockReturnValue(asyncData([fakeRoleNames()]));
    rbacMock.createClusterBinding.mockReturnValue(asyncData([fakeClusterBinding()]));
    rbacMock.createBinding.mockReturnValue(asyncData([fakeBinding()]));

    TestBed
        .configureTestingModule({
          imports: [
            ...modules,
          ],
          declarations: [
            AddBindingComponent,
          ],
          providers: [
            {provide: RBACService, useValue: rbacMock},
            {provide: MatDialogRef, useClass: MatDialogRefMock},
          ],
        })
        .compileComponents();
  }));

  beforeEach(async(() => {
    fixture = TestBed.createComponent(AddBindingComponent);
    component = fixture.componentInstance;
    component.cluster = fakeDigitaloceanCluster();
    component.datacenter = fakeDigitaloceanDatacenter();
    component.projectID = fakeProject().id;
    fixture.detectChanges();
  }));

  it('should create the rbac add binding cmp', async(() => {
       expect(component).toBeTruthy();
     }));

  it('cluster form should be validated correctly', fakeAsync(() => {
       component.bindingType = 'cluster';
       component.setValidators();
       component.form.controls.email.setValue('');
       component.form.controls.role.setValue('');
       fixture.detectChanges();
       expect(component.form.valid).toBeFalsy();

       component.form.controls.email.setValue('test@example.de');
       component.form.controls.role.setValue('role-1');
       fixture.detectChanges();
       expect(component.form.valid).toBeTruthy();
       discardPeriodicTasks();
     }));

  it('namespace form should be validated correctly', fakeAsync(() => {
       component.bindingType = 'namespace';
       component.setValidators();
       component.form.controls.email.setValue('');
       component.form.controls.role.setValue('');
       fixture.detectChanges();
       expect(component.form.valid).toBeFalsy();

       component.form.controls.email.setValue('test@example.de');
       component.form.controls.role.setValue('role-1');
       fixture.detectChanges();
       component.checkNamespaceState();
       expect(component.form.valid).toBeFalsy();

       component.form.controls.namespace.setValue('default');
       fixture.detectChanges();
       expect(component.form.valid).toBeTruthy();
       discardPeriodicTasks();
     }));

  it('should get namespaces', () => {
    component.roles = fakeRoleNames();
    component.form.controls.role.setValue('role-3');
    fixture.detectChanges();
    expect(component.getNamespaces()).toEqual(['default-test', 'test-2']);
  });
});
