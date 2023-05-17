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

import {ComponentFixture, fakeAsync, TestBed, waitForAsync, tick, flush} from '@angular/core/testing';
import {MatDialog} from '@angular/material/dialog';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {DialogTestModule, NoopConfirmDialogComponent} from '@test/components/noop-confirmation-dialog.component';
import {fakeDigitaloceanCluster} from '@test/data/cluster';
import {fakeRuleGroups} from '@test/data/mla';
import {fakeProject} from '@test/data/project';
import {UserMockService} from '@test/services/user-mock';
import {CoreModule} from '@core/module';
import {NotificationService} from '@core/services/notification';
import {MLAService} from '@core/services/mla';
import {UserService} from '@core/services/user';
import {SharedModule} from '@shared/module';
import {of} from 'rxjs';
import {RuleGroupsComponent} from './component';

describe('RuleGroupsComponent', () => {
  let fixture: ComponentFixture<RuleGroupsComponent>;
  let noop: ComponentFixture<NoopConfirmDialogComponent>;
  let component: RuleGroupsComponent;
  let deleteRuleGroupSpy: jest.Mock;

  beforeEach(waitForAsync(() => {
    const mlaMock = {
      deleteRuleGroup: jest.fn(),
      refreshRuleGroups: () => {},
    };
    deleteRuleGroupSpy = mlaMock.deleteRuleGroup.mockReturnValue(of(null));

    TestBed.configureTestingModule({
      imports: [BrowserModule, BrowserAnimationsModule, SharedModule, CoreModule, DialogTestModule],
      declarations: [RuleGroupsComponent],
      providers: [
        {provide: MLAService, useValue: mlaMock},
        {provide: UserService, useClass: UserMockService},
        MatDialog,
        NotificationService,
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  }));

  beforeEach(waitForAsync(() => {
    fixture = TestBed.createComponent(RuleGroupsComponent);
    component = fixture.componentInstance;
    noop = TestBed.createComponent(NoopConfirmDialogComponent);
    component.cluster = fakeDigitaloceanCluster();
    component.projectID = fakeProject().id;
    component.ruleGroups = fakeRuleGroups();
    component.isClusterRunning = true;
    fixture.detectChanges();
  }));

  it('should create the rule group component', fakeAsync(() => {
    expect(component).toBeTruthy();
  }));

  it('should open the delete rule group confirmation dialog & call delete()', fakeAsync(() => {
    const waitTime = 15000;
    component.delete(component.ruleGroups[0]);
    noop.detectChanges();
    tick(waitTime);

    const dialogTitle = document.body.querySelector('.mat-mdc-dialog-title');
    const resetButton = document.body.querySelector('#km-confirmation-dialog-confirm-btn') as HTMLInputElement;

    expect(dialogTitle.textContent).toBe('Delete Rule Group');
    expect(resetButton.textContent).toContain('Delete');

    resetButton.click();

    noop.detectChanges();
    fixture.detectChanges();
    tick(waitTime);

    expect(deleteRuleGroupSpy).toHaveBeenCalled();
    fixture.destroy();
    flush();
  }));
});
