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

import {Injectable} from '@angular/core';
import {defer, Observable, of} from 'rxjs';
import {async} from 'rxjs-compat/scheduler/async';
import {Cluster, MasterVersion, Token} from '@shared/entity/cluster';
import {Node} from '@shared/entity/node';
import {fakeDigitaloceanSizes, fakeEquinixSizes} from '../fake-data/add-node-modal';
import {fakeAlibabaInstanceTypes, fakeAlibabaVSwitches, fakeAlibabaZones} from '../fake-data/alibaba';
import {fakeAnexiaTemplates, fakeAnexiaVlans} from '../fake-data/anexia';
import {masterVersionsFake} from '../fake-data/cluster-spec';
import {fakeToken} from '../fake-data/cluster';
import {nodesFake} from '../fake-data/node';
import {fakeVSphereNetworks} from '../fake-data/vsphere';
import {VSphereNetwork} from '@shared/entity/provider/vsphere';
import {AlibabaInstanceType, AlibabaVSwitch, AlibabaZone} from '@shared/entity/provider/alibaba';
import {AnexiaTemplate, AnexiaVlan} from '@shared/entity/provider/anexia';
import {EquinixSize} from '@shared/entity/provider/equinix';
import {GCPDiskType, GCPMachineSize, GCPNetwork, GCPSubnetwork, GCPZone} from '@shared/entity/provider/gcp';
import {DigitaloceanSizes} from '@shared/entity/provider/digitalocean';

@Injectable()
export class ApiMockService {
  nodes: Node[] = nodesFake();
  masterVersions: MasterVersion[] = masterVersionsFake();
  token: Token = fakeToken();
  vsphereNetworks: VSphereNetwork[] = fakeVSphereNetworks();

  getToken(_cluster: Cluster, _dc: string, _projectID: string): Observable<Token> {
    return of(this.token);
  }

  editToken(_cluster: Cluster, _dc: string, _projectID: string, _token: Token): Observable<Token> {
    return of(this.token);
  }

  editViewerToken(_cluster: Cluster, _dc: string, _projectID: string, _token: Token): Observable<Token> {
    return of(this.token);
  }

  getMasterVersions(): Observable<MasterVersion[]> {
    return of(this.masterVersions);
  }

  getVSphereNetworks(_username: string, _password: string, _datacenterName: string): Observable<VSphereNetwork[]> {
    return of(this.vsphereNetworks);
  }

  getDigitaloceanSizes(): Observable<DigitaloceanSizes> {
    return of(fakeDigitaloceanSizes());
  }

  getGCPSizes(_zone: string, _projectId: string, _dc: string, _clusterId: string): Observable<GCPMachineSize[]> {
    return of([]);
  }

  getGCPDiskTypes(_zone: string, _projectId: string, _dc: string, _clusterId: string): Observable<GCPDiskType[]> {
    return of([]);
  }

  getGCPZones(_projectId: string, _dc: string, _clusterId: string): Observable<GCPZone[]> {
    return of([]);
  }

  getGCPNetworks(_projectId: string, _dc: string, _clusterId: string): Observable<GCPNetwork[]> {
    return of([]);
  }

  getGCPSubnetworks(
    _projectId: string,
    _dc: string,
    _clusterId: string,
    _network: string
  ): Observable<GCPSubnetwork[]> {
    return of([]);
  }

  getKubeconfigURL(): string {
    return '';
  }

  getEquinixSizes(): Observable<EquinixSize[]> {
    return of(fakeEquinixSizes());
  }

  getAlibabaInstanceTypes(): Observable<AlibabaInstanceType[]> {
    return of(fakeAlibabaInstanceTypes());
  }

  getAlibabaZones(): Observable<AlibabaZone[]> {
    return of(fakeAlibabaZones());
  }

  getAlibabaVSwitches(): Observable<AlibabaVSwitch[]> {
    return of(fakeAlibabaVSwitches());
  }

  getAnexiaVlans(): Observable<AnexiaVlan[]> {
    return of(fakeAnexiaVlans());
  }

  getAnexiaTemplates(): Observable<AnexiaTemplate[]> {
    return of(fakeAnexiaTemplates());
  }

  getDashboardProxyURL(): string {
    return '';
  }

  getAdmissionPlugins(_version: string): Observable<string[]> {
    return of(['PodNodeSecurity', 'PodSecurityPolicy']);
  }
}

export function asyncData<T>(data: T): Observable<T> {
  return defer(() => of(data, async));
}
