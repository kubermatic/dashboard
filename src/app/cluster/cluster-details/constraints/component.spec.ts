// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {ComponentFixture, fakeAsync, TestBed, waitForAsync, tick, flush} from '@angular/core/testing';
import {MatDialog} from '@angular/material/dialog';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {DialogTestModule, NoopConfirmDialogComponent} from '@app/testing/components/noop-confirmation-dialog.component';
import {fakeDigitaloceanCluster} from '@app/testing/fake-data/cluster.fake';
import {fakeConstraints, fakeConstraintTemplates} from '@app/testing/fake-data/opa.fake';
import {fakeProject} from '@app/testing/fake-data/project.fake';
import {UserMockService} from '@app/testing/services/user-mock.service';
import {CoreModule} from '@core/module';
import {NotificationService} from '@core/services/notification/service';
import {UserService} from '@core/services/user/service';
import {OPAService} from '@core/services/opa/service';
import {SharedModule} from '@shared/shared.module';
import {of} from 'rxjs';
import {ConstraintsComponent} from './component';
import {ViolationDetailsComponent} from './violation-details/component';

const modules: any[] = [BrowserModule, BrowserAnimationsModule, SharedModule, CoreModule, DialogTestModule];

describe('ConstraintsComponent', () => {
  let fixture: ComponentFixture<ConstraintsComponent>;
  let noop: ComponentFixture<NoopConfirmDialogComponent>;
  let component: ConstraintsComponent;
  let deleteConstraintSpy;

  beforeEach(
    waitForAsync(() => {
      const opaMock = {
        deleteConstraint: jest.fn(),
        constraintTemplates: of(fakeConstraintTemplates()),
        saveViolationPageIndex: jest.fn(),
        getViolationPageIndex: jest.fn(),
        refreshConstraint: () => {},
      };
      deleteConstraintSpy = opaMock.deleteConstraint.mockReturnValue(of(null));
      opaMock.saveViolationPageIndex.mockReturnValue(null);
      opaMock.getViolationPageIndex.mockReturnValue(0);

      TestBed.configureTestingModule({
        imports: [...modules],
        declarations: [ConstraintsComponent, ViolationDetailsComponent],
        providers: [
          {provide: UserService, useClass: UserMockService},
          {provide: OPAService, useValue: opaMock},
          MatDialog,
          NotificationService,
        ],
      }).compileComponents();
    })
  );

  beforeEach(
    waitForAsync(() => {
      fixture = TestBed.createComponent(ConstraintsComponent);
      component = fixture.componentInstance;
      noop = TestBed.createComponent(NoopConfirmDialogComponent);
      component.cluster = fakeDigitaloceanCluster();
      component.projectID = fakeProject().id;
      component.constraints = fakeConstraints();
      component.isClusterRunning = true;
      fixture.detectChanges();
    })
  );

  it(
    'should create the constraints component',
    waitForAsync(() => {
      expect(component).toBeTruthy();
    })
  );

  it('should filter constraints by constraint template', fakeAsync(() => {
    component.constraintTemplateFilter = fakeConstraintTemplates()[0].spec.crd.spec.names.kind;
    component.filter();
    fixture.detectChanges();
    expect(component.dataSource.data).toEqual([fakeConstraints()[0]]);
  }));

  it('should open the delete constraint confirmation dialog & call delete()', fakeAsync(() => {
    const waitTime = 15000;
    const event = new MouseEvent('click');
    component.delete(fakeConstraints()[0], event);
    noop.detectChanges();
    tick(waitTime);

    const dialogTitle = document.body.querySelector('.mat-dialog-title');
    const deleteButton = document.body.querySelector('#km-confirmation-dialog-confirm-btn') as HTMLInputElement;

    expect(dialogTitle.textContent).toBe('Delete Constraint');
    expect(deleteButton.textContent).toBe(' Delete ');

    deleteButton.click();

    noop.detectChanges();
    fixture.detectChanges();
    tick(waitTime);

    expect(deleteConstraintSpy).toHaveBeenCalled();
    fixture.destroy();
    flush();
  }));
});
