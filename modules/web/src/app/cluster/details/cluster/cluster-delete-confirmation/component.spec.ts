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

import {HttpClientModule} from '@angular/common/http';
import {ComponentFixture, fakeAsync, flush, TestBed, tick, waitForAsync} from '@angular/core/testing';
import {MatLegacyDialogRef as MatDialogRef} from '@angular/material/legacy-dialog';
import {BrowserModule, By} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {Router} from '@angular/router';
import {AppConfigService} from '@app/config.service';
import {GoogleAnalyticsService} from '@app/google-analytics.service';
import {fakeDigitaloceanCluster} from '@test/data/cluster';
import {fakeProject} from '@test/data/project';
import {RouterStub, RouterTestingModule} from '@test/services/router-stubs';
import {AppConfigMockService} from '@test/services/app-config-mock';
import {ClusterMockService} from '@test/services/cluster-mock';
import {DatacenterMockService} from '@test/services/datacenter-mock';
import {MatDialogRefMock} from '@test/services/mat-dialog-ref-mock';
import {SettingsMockService} from '@test/services/settings-mock';
import {ClusterService} from '@core/services/cluster';
import {DatacenterService} from '@core/services/datacenter';
import {NotificationService} from '@core/services/notification';
import {SettingsService} from '@core/services/settings';
import {SharedModule} from '@shared/module';
import {of} from 'rxjs';
import {ClusterDeleteConfirmationComponent} from './component';

describe('ClusterDeleteConfirmationComponent', () => {
  let fixture: ComponentFixture<ClusterDeleteConfirmationComponent>;
  let component: ClusterDeleteConfirmationComponent;
  let clusterService: ClusterService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, HttpClientModule, BrowserAnimationsModule, RouterTestingModule, SharedModule],
      declarations: [ClusterDeleteConfirmationComponent],
      providers: [
        {provide: MatDialogRef, useClass: MatDialogRefMock},
        {provide: ClusterService, useClass: ClusterMockService},
        {provide: DatacenterService, useClass: DatacenterMockService},
        {provide: Router, useClass: RouterStub},
        GoogleAnalyticsService,
        {provide: AppConfigService, useClass: AppConfigMockService},
        {provide: SettingsService, useClass: SettingsMockService},
        NotificationService,
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClusterDeleteConfirmationComponent);
    component = fixture.componentInstance;

    clusterService = fixture.debugElement.injector.get(ClusterService);
    fixture.debugElement.injector.get(Router);
  });

  it('should initialize', waitForAsync(() => {
    expect(component).toBeTruthy();
  }));

  it('should able add button', () => {
    component.projectID = fakeProject().id;
    component.cluster = fakeDigitaloceanCluster();

    fixture.detectChanges();

    const input = fixture.debugElement.query(By.css('#km-delete-cluster-dialog-input'));
    const inputElement = input.nativeElement;
    inputElement.value = fakeDigitaloceanCluster().name;

    inputElement.dispatchEvent(new Event('blur'));

    expect(component.inputName === component.cluster.name).toBeTruthy();
  });

  it('should call deleteCluster method', fakeAsync(() => {
    component.cluster = fakeDigitaloceanCluster();
    component.inputName = fakeDigitaloceanCluster().name;
    component.projectID = fakeProject().id;

    fixture.detectChanges();
    const spyDeleteCluster = jest.spyOn(clusterService, 'delete').mockReturnValue(of(null));

    component.getObservable().subscribe();
    tick();
    flush();

    expect(spyDeleteCluster).toHaveBeenCalled();
  }));
});
