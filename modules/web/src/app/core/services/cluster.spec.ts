// Copyright 2022 The Kubermatic Kubernetes Platform contributors.
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

import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';
import {lastValueFrom} from 'rxjs';
import {MatDialogModule} from '@angular/material/dialog';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {RouterTestingModule} from '@angular/router/testing';

import {AppConfigService} from '@app/config.service';

import {environment} from '@environments/environment';

import {fakeProject} from '@test/data/project';
import {RequestType} from '@test/types/request-type';
import {machineDeploymentsFake} from '@test/data/node';
import {fakeDigitaloceanCluster} from '@test/data/cluster';
import {AppConfigMockService} from '@test/services/app-config-mock';

import {ClusterService} from './cluster';

describe('ClusterService', () => {
  let service: ClusterService;
  let httpController: HttpTestingController;

  const mockMachineDeploymentID = machineDeploymentsFake()[0].id;
  const mockClusterID = fakeDigitaloceanCluster().id;
  const mockProjectID = fakeProject().id;

  const newRestRoot = environment.newRestRoot;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ClusterService, {provide: AppConfigService, useClass: AppConfigMockService}],
      imports: [HttpClientTestingModule, MatDialogModule, MatSnackBarModule, RouterTestingModule],
    });
    httpController = TestBed.inject(HttpTestingController);
    service = TestBed.inject(ClusterService);
  });

  afterEach(() => {
    httpController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('OIDC flow URLs', () => {
    const origin = encodeURIComponent(window.location.origin);

    it('should send the browser origin to the Kubernetes Dashboard login', () => {
      expect(service.getDashboardProxyURL(mockProjectID, mockClusterID)).toBe(
        `${newRestRoot}/dashboard/login?projectID=${mockProjectID}&clusterID=${mockClusterID}&origin=${origin}`
      );
    });

    it('should send the browser origin to the web terminal kubeconfig login', () => {
      expect(service.getWebTerminalProxyURL(mockProjectID, mockClusterID, 'user-id')).toBe(
        `${newRestRoot}/kubeconfig/secret?project_id=${mockProjectID}&cluster_id=${mockClusterID}&user_id=user-id&origin=${origin}`
      );
    });

    it('should build the share link on the browser origin and send that origin', () => {
      const restRoot = environment.restRoot.replace(/^\//, '');
      expect(service.getShareKubeconfigURL(mockProjectID, mockClusterID, 'user-id', true)).toBe(
        `${window.location.origin}/${restRoot}/kubeconfig?project_id=${mockProjectID}&cluster_id=${mockClusterID}&user_id=user-id&oidc_kubelogin_enabled=true&origin=${origin}`
      );
    });

    it('should not send the origin for the kubeconfig download', () => {
      expect(service.getKubeconfigURL(mockProjectID, mockClusterID)).not.toContain('origin=');
    });
  });

  it('should dispatch correct URL with GET request when externalMachineDeploymentNodes() is called', () => {
    lastValueFrom(service.externalMachineDeploymentNodes(mockProjectID, mockClusterID, mockMachineDeploymentID));
    const req = httpController.expectOne(
      `${newRestRoot}/projects/${mockProjectID}/kubernetes/clusters/${mockClusterID}/machinedeployments/${mockMachineDeploymentID}/nodes`
    );
    expect(req.request.method).toBe(RequestType.GET);
    req.flush({});
  });

  it('should dispatch correct URL with GET request when externalMachineDeploymentNodesMetrics() is called', () => {
    lastValueFrom(service.externalMachineDeploymentNodesMetrics(mockProjectID, mockClusterID, mockMachineDeploymentID));
    const req = httpController.expectOne(
      `${newRestRoot}/projects/${mockProjectID}/kubernetes/clusters/${mockClusterID}/machinedeployments/${mockMachineDeploymentID}/nodes/metrics`
    );
    expect(req.request.method).toBe(RequestType.GET);
    req.flush({});
  });

  it('should dispatch correct URL with GET request when externalMachineDeploymentNodesEvents() is called', () => {
    lastValueFrom(service.externalMachineDeploymentNodesEvents(mockProjectID, mockClusterID, mockMachineDeploymentID));
    const req = httpController.expectOne(
      `${newRestRoot}/projects/${mockProjectID}/kubernetes/clusters/${mockClusterID}/machinedeployments/${mockMachineDeploymentID}/nodes/events`
    );
    expect(req.request.method).toBe(RequestType.GET);
    req.flush({});
  });
});
