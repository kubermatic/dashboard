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

import {ComponentFixture, fakeAsync, TestBed, tick, waitForAsync} from '@angular/core/testing';
import {MatDialog} from '@angular/material/dialog';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {GoogleAnalyticsService} from '@app/google-analytics.service';
import {fakeDigitaloceanCluster} from '@app/testing/fake-data/cluster.fake';
import {nodeAWSFake, nodeFake} from '@app/testing/fake-data/node.fake';
import {fakeProject} from '@app/testing/fake-data/project.fake';
import {ClusterMockService} from '@app/testing/services/cluster-mock-service';
import {SettingsMockService} from '@app/testing/services/settings-mock.service';
import {UserMockService} from '@app/testing/services/user-mock.service';
import {ClusterService} from '@core/services/cluster/service';
import {NotificationService} from '@core/services/notification/service';
import {SettingsService} from '@core/services/settings/service';
import {UserService} from '@core/services/user/service';
import {SharedModule} from '@shared/shared.module';
import {of} from 'rxjs';
import {NodeListComponent} from './component';

class MatDialogMock {
  open(): any {
    return {afterClosed: () => of([true])};
  }
}

const modules: any[] = [BrowserModule, BrowserAnimationsModule, SharedModule];

describe('NodeComponent', () => {
  let fixture: ComponentFixture<NodeListComponent>;
  let component: NodeListComponent;
  let clusterService: ClusterService;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [...modules],
        declarations: [NodeListComponent],
        providers: [
          {provide: ClusterService, useClass: ClusterMockService},
          {provide: MatDialog, useClass: MatDialogMock},
          {provide: SettingsService, useClass: SettingsMockService},
          {provide: UserService, useClass: UserMockService},
          GoogleAnalyticsService,
          NotificationService,
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(NodeListComponent);
    component = fixture.componentInstance;
    clusterService = fixture.debugElement.injector.get(ClusterService);
  });

  it(
    'should create the cluster details cmp',
    waitForAsync(() => {
      expect(component).toBeTruthy();
    })
  );

  it('should call deleteNode', fakeAsync(() => {
    component.cluster = fakeDigitaloceanCluster();
    component.projectID = fakeProject().id;
    const event = new MouseEvent('click');

    fixture.detectChanges();
    const spyDeleteClusterNode = jest.spyOn(clusterService, 'deleteNode').mockReturnValue(of(null));

    component.deleteNodeDialog(nodeFake(), event);
    tick();

    expect(spyDeleteClusterNode).toHaveBeenCalledTimes(1);
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
    expect(component.displayTags(tags)).toBeTruthy();
  });

  it('should not display tags', () => {
    const tags = {};
    expect(component.displayTags(tags)).toBeFalsy();
  });
});
