// Copyright 2026 The Kubermatic Kubernetes Platform contributors.
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

import {HttpClient} from '@angular/common/http';
import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';
import {VSphere} from '@core/services/wizard/provider/vsphere';
import {NodeProvider} from '@shared/model/NodeProviderConstants';

describe('vSphere provider service', () => {
  const projectID = 'project-id';
  let httpMock: HttpTestingController;
  let service: VSphere;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      teardown: {destroyAfterEach: false},
    });
    httpMock = TestBed.inject(HttpTestingController);
    service = new VSphere(TestBed.inject(HttpClient), projectID, NodeProvider.VSPHERE);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('#datastoreClusters', () => {
    it('should load the datastore clusters with the credentials as headers', () => {
      let result: string[];
      service
        .username('user')
        .password('pass')
        .datacenter('dc')
        .datastoreClusters()
        .subscribe(datastoreClusters => (result = datastoreClusters));

      const req = httpMock.expectOne(r => r.url.endsWith(`/projects/${projectID}/providers/vsphere/datastoreclusters`));
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Username')).toBe('user');
      expect(req.request.headers.get('Password')).toBe('pass');
      expect(req.request.headers.get('DatacenterName')).toBe('dc');
      req.flush({datastoreClusters: ['/DC0/datastore/pod-a', '/DC0/datastore/pod-b']});

      expect(result).toEqual(['/DC0/datastore/pod-a', '/DC0/datastore/pod-b']);
    });

    it('should call the loading callback', () => {
      const onLoading = jest.fn();
      service.username('user').password('pass').datacenter('dc').datastoreClusters(onLoading).subscribe();

      httpMock.expectOne(r => r.url.endsWith('/datastoreclusters')).flush({datastoreClusters: []});

      expect(onLoading).toHaveBeenCalledTimes(1);
    });

    it('should not send a request without credentials', () => {
      service.datastoreClusters().subscribe();

      httpMock.expectNone(r => r.url.endsWith('/datastoreclusters'));
    });
  });

  describe('#resourcePools', () => {
    it('should load the resource pools with the credentials as headers', () => {
      let result: string[];
      service
        .username('user')
        .password('pass')
        .datacenter('dc')
        .resourcePools()
        .subscribe(resourcePools => (result = resourcePools));

      const req = httpMock.expectOne(r => r.url.endsWith(`/projects/${projectID}/providers/vsphere/resourcepools`));
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Username')).toBe('user');
      expect(req.request.headers.get('Password')).toBe('pass');
      expect(req.request.headers.get('DatacenterName')).toBe('dc');
      req.flush({resourcePools: ['/DC0/host/cluster/Resources', '/DC0/host/cluster/Resources/pool-a']});

      expect(result).toEqual(['/DC0/host/cluster/Resources', '/DC0/host/cluster/Resources/pool-a']);
    });

    it('should not send a request without credentials', () => {
      service.resourcePools().subscribe();

      httpMock.expectNone(r => r.url.endsWith('/resourcepools'));
    });
  });
});
