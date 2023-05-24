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

import {ComponentFixture, fakeAsync, flush, TestBed, waitForAsync} from '@angular/core/testing';
import {MatDialog} from '@angular/material/dialog';
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {GoogleAnalyticsService} from '@app/google-analytics.service';
import {fakeDigitaloceanCluster} from '@test/data/cluster';
import {nodeAWSFake, nodeFake} from '@test/data/node';
import {fakeProject} from '@test/data/project';
import {ClusterMockService} from '@test/services/cluster-mock';
import {NotificationMockService} from '@test/services/notification-mock';
import {SettingsMockService} from '@test/services/settings-mock';
import {UserMockService} from '@test/services/user-mock';
import {ClusterService} from '@core/services/cluster';
import {NotificationService} from '@core/services/notification';
import {SettingsService} from '@core/services/settings';
import {UserService} from '@core/services/user';
import {SharedModule} from '@shared/module';
import {of} from 'rxjs';
import {NodeListComponent} from './component';

class MatDialogMock {
  open(): any {
    return {afterClosed: () => of([true])};
  }
}

describe('NodeComponent', () => {
  let fixture: ComponentFixture<NodeListComponent>;
  let component: NodeListComponent;
  let clusterService: ClusterService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule],
      declarations: [NodeListComponent],
      providers: [
        {provide: ClusterService, useClass: ClusterMockService},
        {provide: MatDialog, useClass: MatDialogMock},
        {provide: SettingsService, useClass: SettingsMockService},
        {provide: UserService, useClass: UserMockService},
        {provide: NotificationService, useClass: NotificationMockService},
        GoogleAnalyticsService,
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NodeListComponent);
    component = fixture.componentInstance;
    clusterService = fixture.debugElement.injector.get(ClusterService);
  });

  it('should create the cluster details cmp', waitForAsync(() => {
    expect(component).toBeTruthy();
  }));

  it('should call deleteNode', fakeAsync(() => {
    component.cluster = fakeDigitaloceanCluster();
    component.projectID = fakeProject().id;

    const spy = jest.spyOn(clusterService, 'deleteNode').mockReturnValue(of(null));

    component.deleteNodeDialog(nodeFake());
    flush();

    expect(spy).toHaveBeenCalled();
  }));

  it('should get operating system name', () => {
    expect(component.getSystem(nodeFake())).toBe('Ubuntu');
  });

  it('should get info text for name', () => {
    expect(component.getInfo(nodeFake())).toBe('kubermatic-tbbfvttvs-v5hmk');
  });

  it('should get info text for aws name', () => {
    expect(component.getInfo(nodeAWSFake())).toBe('ip-172-31-1-240.eu-central-1.compute.internal');
  });

  it('should get node name', () => {
    expect(component.getNodeName(nodeFake())).toBe('kubermatic-tbbfvttvs-v5hmk');
  });

  it('should display tags', () => {
    const tags = {test: 'test', tag: 'tag'};
    expect(component.hasTags(tags)).toBeTruthy();
  });

  it('should not display tags', () => {
    const tags = {};
    expect(component.hasTags(tags)).toBeFalsy();
  });
});
