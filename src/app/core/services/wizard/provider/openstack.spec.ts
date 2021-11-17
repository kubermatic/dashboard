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

import {HttpClientTestingModule, HttpTestingController, TestRequest} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';
import {Openstack} from '@core/services/wizard/provider/openstack';
import {OpenstackAvailabilityZone, OpenstackNetwork, OpenstackSecurityGroup} from '@shared/entity/provider/openstack';
import {NodeProvider} from '@shared/model/NodeProviderConstants';

describe('openstack provider service', () => {
  let service: Openstack;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [Openstack, {provide: NodeProvider, useValue: NodeProvider.OPENSTACK}],
    });
    service = TestBed.inject(Openstack);
    httpMock = TestBed.inject(HttpTestingController);

    service.domain(FakeValue.Domain);
    service.username(FakeValue.Username);
    service.password(FakeValue.Password);
    service.datacenter(FakeValue.Datacenter);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('#networks', () => {
    const dummyNetworks: OpenstackNetwork[] = [
      {
        id: 'net-id',
        name: 'net-name',
        external: true,
      },
    ];

    test('with project auth', () => {
      service.project(FakeValue.Project);

      service
        .networks(() => {})
        .subscribe(networks => {
          expect(networks.length).toBe(1);
          expect(networks).toEqual(dummyNetworks);
        });

      const req = httpMock.expectOne(service.networksUrl);
      expect(req.request.method).toBe('GET');
      expectProjectAuthHeaderToBeDefined(req);
      req.flush(dummyNetworks);
    });
    test('with projectID auth', () => {
      service.projectID(FakeValue.ProjectID);

      service
        .networks(() => {})
        .subscribe(networks => {
          expect(networks.length).toBe(1);
          expect(networks).toEqual(dummyNetworks);
        });

      const req = httpMock.expectOne(service.networksUrl);
      expect(req.request.method).toBe('GET');
      expectProjectIdAuthHeaderToBeDefined(req);
      req.flush(dummyNetworks);
    });

    test('with ApplicationID auth', () => {
      service.datacenter(FakeValue.Datacenter);
      service.applicationCredentialID(FakeValue.ApplicationCredentialID);
      service.applicationCredentialPassword(FakeValue.ApplicationCredentialSecret);
      service
        .networks(() => {})
        .subscribe(networks => {
          expect(networks.length).toBe(1);
          expect(networks).toEqual(dummyNetworks);
        });

      const req = httpMock.expectOne(service.networksUrl);
      expect(req.request.method).toBe('GET');
      expectApplicationIdHeaderToBeDefined(req);
      req.flush(dummyNetworks);
    });
  });

  describe('#availabilityZones', () => {
    const dummyAZ: OpenstackAvailabilityZone[] = [
      {
        name: 'az-name',
      },
    ];

    test('with project auth', () => {
      service.project(FakeValue.Project);

      service
        .availabilityZones(() => {})
        .subscribe(az => {
          expect(az.length).toBe(1);
          expect(az).toEqual(dummyAZ);
        });

      const req = httpMock.expectOne(service.availabilityZonesUrl);
      expect(req.request.method).toBe('GET');
      expectProjectAuthHeaderToBeDefined(req);
      req.flush(dummyAZ);
    });
    test('with projectID auth', () => {
      service.projectID(FakeValue.ProjectID);

      service
        .availabilityZones(() => {})
        .subscribe(az => {
          expect(az.length).toBe(1);
          expect(az).toEqual(dummyAZ);
        });

      const req = httpMock.expectOne(service.availabilityZonesUrl);
      expect(req.request.method).toBe('GET');
      expectProjectIdAuthHeaderToBeDefined(req);
      req.flush(dummyAZ);
    });

    test('with ApplicationID auth', () => {
      service.datacenter(FakeValue.Datacenter);
      service.applicationCredentialID(FakeValue.ApplicationCredentialID);
      service.applicationCredentialPassword(FakeValue.ApplicationCredentialSecret);
      service
        .availabilityZones(() => {})
        .subscribe(az => {
          expect(az.length).toBe(1);
          expect(az).toEqual(dummyAZ);
        });

      const req = httpMock.expectOne(service.availabilityZonesUrl);
      expect(req.request.method).toBe('GET');
      expectApplicationIdHeaderToBeDefined(req);
      req.flush(dummyAZ);
    });
  });

  describe('#securityGroups', () => {
    const dummySecGroup: OpenstackSecurityGroup[] = [
      {
        name: 'sec-group--name',
        id: 'sec-group-id',
      },
    ];

    test('with project auth', () => {
      service.project(FakeValue.Project);

      service
        .securityGroups(() => {})
        .subscribe(secGroup => {
          expect(secGroup.length).toBe(1);
          expect(secGroup).toEqual(dummySecGroup);
        });

      const req = httpMock.expectOne(service.securityGroupsUrl);
      expect(req.request.method).toBe('GET');
      expectProjectAuthHeaderToBeDefined(req);
      req.flush(dummySecGroup);
    });
    test('with projectID auth', () => {
      service.projectID(FakeValue.ProjectID);

      service
        .securityGroups(() => {})
        .subscribe(secGroup => {
          expect(secGroup.length).toBe(1);
          expect(secGroup).toEqual(dummySecGroup);
        });

      const req = httpMock.expectOne(service.securityGroupsUrl);
      expect(req.request.method).toBe('GET');
      expectProjectIdAuthHeaderToBeDefined(req);
      req.flush(dummySecGroup);
    });

    test('with ApplicationID auth', () => {
      service.datacenter(FakeValue.Datacenter);
      service.applicationCredentialID(FakeValue.ApplicationCredentialID);
      service.applicationCredentialPassword(FakeValue.ApplicationCredentialSecret);
      service
        .securityGroups(() => {})
        .subscribe(secGroup => {
          expect(secGroup.length).toBe(1);
          expect(secGroup).toEqual(dummySecGroup);
        });

      const req = httpMock.expectOne(service.securityGroupsUrl);
      expect(req.request.method).toBe('GET');
      expectApplicationIdHeaderToBeDefined(req);
      req.flush(dummySecGroup);
    });
  });
});

enum FakeValue {
  Username = 'the-user',
  Password = 'fake-pass',
  ApplicationCredentialID = 'the-application-id',
  ApplicationCredentialSecret = 'the-ApplicationCredentialSecret',
  Domain = 'the-domain',
  Datacenter = 'the-datacenter',
  Project = 'the-project',
  ProjectID = 'the-projectID',
}

function expectApplicationIdHeaderToBeDefined(req: TestRequest) {
  expect(req.request.headers.get(Openstack.Header.Project)).toBeNull();
  expect(req.request.headers.get(Openstack.Header.ProjectID)).toBeNull();
  expect(req.request.headers.get(Openstack.Header.Username)).toBeNull();
  expect(req.request.headers.get(Openstack.Header.Password)).toBeNull();
  expect(req.request.headers.get(Openstack.Header.Domain)).toBeNull();
  expect(req.request.headers.get(Openstack.Header.ApplicationCredentialID)).toEqual(FakeValue.ApplicationCredentialID);
  expect(req.request.headers.get(Openstack.Header.ApplicationCredentialSecret)).toEqual(
    FakeValue.ApplicationCredentialSecret
  );
  expect(req.request.headers.get(Openstack.Header.Datacenter)).toEqual(FakeValue.Datacenter);
}

function expectProjectAuthHeaderToBeDefined(req: TestRequest) {
  expect(req.request.headers.get(Openstack.Header.Project)).toEqual(FakeValue.Project);
  expect(req.request.headers.get(Openstack.Header.ProjectID)).toBeNull();
  expect(req.request.headers.get(Openstack.Header.Username)).toEqual(FakeValue.Username);
  expect(req.request.headers.get(Openstack.Header.Password)).toEqual(FakeValue.Password);
  expect(req.request.headers.get(Openstack.Header.Domain)).toEqual(FakeValue.Domain);
  expect(req.request.headers.get(Openstack.Header.ApplicationCredentialID)).toBeNull();
  expect(req.request.headers.get(Openstack.Header.ApplicationCredentialSecret)).toBeNull();
  expect(req.request.headers.get(Openstack.Header.Datacenter)).toEqual(FakeValue.Datacenter);
}

function expectProjectIdAuthHeaderToBeDefined(req: TestRequest) {
  expect(req.request.headers.get(Openstack.Header.Project)).toBeNull();
  expect(req.request.headers.get(Openstack.Header.ProjectID)).toEqual(FakeValue.ProjectID);
  expect(req.request.headers.get(Openstack.Header.Username)).toEqual(FakeValue.Username);
  expect(req.request.headers.get(Openstack.Header.Password)).toEqual(FakeValue.Password);
  expect(req.request.headers.get(Openstack.Header.Domain)).toEqual(FakeValue.Domain);
  expect(req.request.headers.get(Openstack.Header.ApplicationCredentialID)).toBeNull();
  expect(req.request.headers.get(Openstack.Header.ApplicationCredentialSecret)).toBeNull();
  expect(req.request.headers.get(Openstack.Header.Datacenter)).toEqual(FakeValue.Datacenter);
}
