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

import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {ReactiveFormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {BehaviorSubject, of} from 'rxjs';
import {environment} from '../../../../environments/environment';
import {WizardService} from '../../../core/services';
import {ClusterProviderForm} from '../../../shared/model/ClusterForm';
import {NodeProvider} from '../../../shared/model/NodeProviderConstants';
import {SharedModule} from '../../../shared/shared.module';
import {fakeDigitaloceanCluster} from '../../../testing/fake-data/cluster.fake';
import {CustomPresetsSettingsComponent, PresetsState} from './custom-presets.component';
import {PresetList} from '../../../shared/entity/preset';

describe('CustomPresetsSettingsComponent', () => {
  let fixture: ComponentFixture<CustomPresetsSettingsComponent>;
  let component: CustomPresetsSettingsComponent;
  let httpTestingController: HttpTestingController;
  let wizardService: WizardService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, BrowserAnimationsModule, ReactiveFormsModule, SharedModule, HttpClientTestingModule],
      declarations: [CustomPresetsSettingsComponent],
      providers: [WizardService],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomPresetsSettingsComponent);
    httpTestingController = TestBed.inject(HttpTestingController);
    wizardService = TestBed.inject(WizardService);
    component = fixture.componentInstance;
    component.cluster = fakeDigitaloceanCluster();
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should initialize', () => {
    expect(component).toBeTruthy();
  });

  it('should show default loading label', () => {
    expect(component.label).toEqual(PresetsState.Loading);
  });

  it('should show no presets available label', () => {
    const provider = NodeProvider.DIGITALOCEAN;
    jest
      .spyOn(wizardService, 'clusterProviderFormChanges$', 'get')
      .mockReturnValue(of({provider} as ClusterProviderForm) as BehaviorSubject<ClusterProviderForm>);

    fixture.detectChanges();

    const req = httpTestingController.expectOne(
      `${environment.restRoot}/providers/${provider}/presets/credentials?datacenter=${component.cluster.spec.cloud.dc}`
    );
    req.flush(new PresetList());

    expect(req.request.method).toEqual('GET');
    expect(component.label).toEqual(PresetsState.Empty);
  });

  it('should show custom preset label', () => {
    const provider = NodeProvider.DIGITALOCEAN;
    jest
      .spyOn(wizardService, 'clusterProviderFormChanges$', 'get')
      .mockReturnValue(of({provider} as ClusterProviderForm) as BehaviorSubject<ClusterProviderForm>);

    fixture.detectChanges();

    const req = httpTestingController.expectOne(
      `${environment.restRoot}/providers/${provider}/presets/credentials?datacenter=${component.cluster.spec.cloud.dc}`
    );
    req.flush(new PresetList('some-preset'));

    expect(req.request.method).toEqual('GET');
    expect(component.label).toEqual(PresetsState.Ready);
  });
});
