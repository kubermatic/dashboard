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

import {ComponentFixture, fakeAsync, flush, TestBed, tick, waitForAsync} from '@angular/core/testing';
import {MatDialog} from '@angular/material/dialog';
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {CoreModule} from '@core/module';
import {NotificationService} from '@core/services/notification';
import {OPAService} from '@core/services/opa';
import {UserService} from '@core/services/user';
import {SharedModule} from '@shared/module';
import {NoopConfirmDialogComponent} from '@test/components/noop-confirmation-dialog.component';
import {fakeConstraintTemplates} from '@test/data/opa';
import {UserMockService} from '@test/services/user-mock';
import {of} from 'rxjs';
import {ConstraintTemplatesComponent} from './component';

describe('ConstraintTemplatesComponent', () => {
  let fixture: ComponentFixture<ConstraintTemplatesComponent>;
  let noop: ComponentFixture<NoopConfirmDialogComponent>;
  let component: ConstraintTemplatesComponent;
  let deleteConstraintTemplateSpy: jest.Mock;

  beforeEach(waitForAsync(() => {
    const opaMock = {
      deleteConstraintTemplate: jest.fn(),
      constraintTemplates: of(fakeConstraintTemplates()),
      refreshConstraintTemplates: () => {},
    };
    deleteConstraintTemplateSpy = opaMock.deleteConstraintTemplate.mockReturnValue(of(null));

    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule, CoreModule],
      declarations: [ConstraintTemplatesComponent],
      providers: [
        {provide: UserService, useClass: UserMockService},
        {provide: OPAService, useValue: opaMock},
        MatDialog,
        NotificationService,
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  }));

  beforeEach(waitForAsync(() => {
    fixture = TestBed.createComponent(ConstraintTemplatesComponent);
    component = fixture.componentInstance;
    noop = TestBed.createComponent(NoopConfirmDialogComponent);
    component.constraintTemplates = fakeConstraintTemplates();
    fixture.detectChanges();
  }));

  it('should create the constraint templates component', waitForAsync(() => {
    expect(component).toBeTruthy();
  }));

  it('should open the delete constraint template confirmation dialog & call delete()', fakeAsync(() => {
    const waitTime = 15000;
    component.delete(fakeConstraintTemplates()[0]);
    noop.detectChanges();
    tick(waitTime);

    const dialogTitle = document.body.querySelector('.mat-mdc-dialog-title');
    const deleteButton = document.body.querySelector('#km-confirmation-dialog-confirm-btn') as HTMLInputElement;

    expect(dialogTitle.textContent).toBe('Delete Constraint Template');
    expect(deleteButton.textContent).toContain('Delete');

    deleteButton.click();

    noop.detectChanges();
    fixture.detectChanges();
    tick(waitTime);

    expect(deleteConstraintTemplateSpy).toHaveBeenCalled();
    fixture.destroy();
    flush();
  }));
});
