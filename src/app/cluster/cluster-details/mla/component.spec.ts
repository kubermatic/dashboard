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

import {ComponentFixture, fakeAsync, TestBed, waitForAsync} from '@angular/core/testing';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {DialogTestModule} from '@app/testing/components/noop-confirmation-dialog.component';
import {fakeDigitaloceanCluster} from '@app/testing/fake-data/cluster';
import {fakeAlertmanagerConfig, fakeRuleGroups} from '@app/testing/fake-data/mla';
import {fakeProject} from '@app/testing/fake-data/project';
import {CoreModule} from '@core/module';
import {SharedModule} from '@shared/module';
import {MLAComponent} from './component';

const modules: any[] = [BrowserModule, BrowserAnimationsModule, SharedModule, CoreModule, DialogTestModule];

describe('MLAComponent', () => {
  let fixture: ComponentFixture<MLAComponent>;
  let component: MLAComponent;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [...modules],
        declarations: [MLAComponent],
        providers: [],
      }).compileComponents();
    })
  );

  beforeEach(
    waitForAsync(() => {
      fixture = TestBed.createComponent(MLAComponent);
      component = fixture.componentInstance;
      component.cluster = fakeDigitaloceanCluster();
      component.projectID = fakeProject().id;
      component.alertmanagerConfig = fakeAlertmanagerConfig();
      component.ruleGroups = fakeRuleGroups();
      component.isClusterRunning = true;
      fixture.detectChanges();
    })
  );

  it('should create the mla component', fakeAsync(() => {
    expect(component).toBeTruthy();
  }));
});
