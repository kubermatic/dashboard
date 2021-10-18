// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {ComponentFixture, discardPeriodicTasks, fakeAsync, TestBed, waitForAsync} from '@angular/core/testing';
import {MatDialogRef} from '@angular/material/dialog';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {fakeDigitaloceanCluster} from '@app/testing/fake-data/cluster';
import {fakeProject} from '@app/testing/fake-data/project';
import {fakeBinding, fakeClusterBinding, fakeClusterRoleNames, fakeRoleNames} from '@app/testing/fake-data/rbac';
import {asyncData} from '@app/testing/services/api-mock';
import {MatDialogRefMock} from '@app/testing/services/mat-dialog-ref-mock';
import {CoreModule} from '@core/module';
import {RBACService} from '@core/services/rbac';
import {SharedModule} from '@shared/module';
import {AddBindingComponent} from './component';

const modules: any[] = [BrowserModule, BrowserAnimationsModule, SharedModule, CoreModule];

describe('AddBindingComponent', () => {
  let fixture: ComponentFixture<AddBindingComponent>;
  let component: AddBindingComponent;

  beforeEach(
    waitForAsync(() => {
      const rbacMock = {
        getClusterRoleNames: jest.fn(),
        getRoleNames: jest.fn(),
        createClusterBinding: jest.fn(),
        createBinding: jest.fn(),
      };

      rbacMock.getClusterRoleNames.mockReturnValue(asyncData(fakeClusterRoleNames()));
      rbacMock.getRoleNames.mockReturnValue(asyncData(fakeRoleNames()));
      rbacMock.createClusterBinding.mockReturnValue(asyncData(fakeClusterBinding()));
      rbacMock.createBinding.mockReturnValue(asyncData(fakeBinding()));

      TestBed.configureTestingModule({
        imports: [...modules],
        declarations: [AddBindingComponent],
        providers: [
          {provide: RBACService, useValue: rbacMock},
          {provide: MatDialogRef, useClass: MatDialogRefMock},
        ],
      }).compileComponents();
    })
  );

  beforeEach(
    waitForAsync(() => {
      fixture = TestBed.createComponent(AddBindingComponent);
      component = fixture.componentInstance;
      component.cluster = fakeDigitaloceanCluster();
      component.projectID = fakeProject().id;
      fixture.detectChanges();
    })
  );

  it(
    'should create the rbac add binding cmp',
    waitForAsync(() => {
      expect(component).toBeTruthy();
    })
  );

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
