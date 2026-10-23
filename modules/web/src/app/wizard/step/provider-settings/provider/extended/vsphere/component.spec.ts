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

import {HttpClientModule} from '@angular/common/http';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {ReactiveFormsModule} from '@angular/forms';
import {By} from '@angular/platform-browser';
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {AppConfigService} from '@app/config.service';
import {NODE_DATA_CONFIG, NodeDataMode} from '@app/node-data/config';
import {Auth} from '@core/services/auth/service';
import {ClusterSpecService} from '@core/services/cluster-spec';
import {DatacenterService} from '@core/services/datacenter';
import {MachineDeploymentService} from '@core/services/machine-deployment';
import {NodeDataService} from '@core/services/node-data/service';
import {ProjectService} from '@core/services/project';
import {AlibabaService} from '@core/services/provider/alibaba';
import {AnexiaService} from '@core/services/provider/anexia';
import {AWSService} from '@core/services/provider/aws';
import {AzureService} from '@core/services/provider/azure';
import {BaremetalService} from '@core/services/provider/baremetal';
import {DigitalOceanService} from '@core/services/provider/digitalocean';
import {GCPService} from '@core/services/provider/gcp';
import {HetznerService} from '@core/services/provider/hetzner';
import {KubeVirtService} from '@core/services/provider/kubevirt';
import {NutanixService} from '@core/services/provider/nutanix';
import {OpenStackService} from '@core/services/provider/openstack';
import {VMwareCloudDirectorService} from '@core/services/provider/vmware-cloud-director';
import {VSphereService} from '@core/services/provider/vsphere';
import {ApplicationService} from '@core/services/application';
import {PresetsService} from '@core/services/wizard/presets';
import {WizardService} from '@core/services/wizard/wizard';
import {AutocompleteComponent} from '@shared/components/autocomplete/component';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {SharedModule} from '@shared/module';
import {AuthMockService} from '@test/services/auth-mock';
import {ProjectMockService} from '@test/services/project-mock';
import {VSphereProviderExtendedComponent} from './component';

describe('VSphereProviderExtendedComponent', () => {
  let fixture: ComponentFixture<VSphereProviderExtendedComponent>;
  let component: VSphereProviderExtendedComponent;
  let clusterSpecService: ClusterSpecService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, ReactiveFormsModule, SharedModule, HttpClientModule],
      declarations: [VSphereProviderExtendedComponent],
      providers: [
        WizardService,
        NodeDataService,
        ClusterSpecService,
        PresetsService,
        DatacenterService,
        AppConfigService,
        AlibabaService,
        AnexiaService,
        AWSService,
        AzureService,
        BaremetalService,
        DigitalOceanService,
        GCPService,
        HetznerService,
        OpenStackService,
        NutanixService,
        VMwareCloudDirectorService,
        KubeVirtService,
        MachineDeploymentService,
        ApplicationService,
        VSphereService,
        {provide: ProjectService, useValue: ProjectMockService},
        {provide: Auth, useClass: AuthMockService},
        {provide: NODE_DATA_CONFIG, useValue: NodeDataMode.Wizard},
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  }));

  beforeEach(() => {
    clusterSpecService = TestBed.inject(ClusterSpecService);
    clusterSpecService.provider = NodeProvider.VSPHERE;

    fixture = TestBed.createComponent(VSphereProviderExtendedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    // The wizard emits the preset (here: none) once the step is shown, which enables the fields.
    TestBed.inject(PresetsService).presetChanges.emit(undefined);
    fixture.detectChanges();
  });

  function baseFolderPathField(): AutocompleteComponent {
    return fixture.debugElement
      .queryAll(By.directive(AutocompleteComponent))
      .map(element => element.componentInstance as AutocompleteComponent)
      .find(field => field.label === 'Base Folder Path');
  }

  function datastoreClusterField(): AutocompleteComponent {
    return fixture.debugElement
      .queryAll(By.directive(AutocompleteComponent))
      .map(element => element.componentInstance as AutocompleteComponent)
      .find(field => field.label === 'Datastore Cluster');
  }

  function setDatastoreCluster(datastoreCluster: string): void {
    component.form.get(component.Controls.DatastoreCluster).setValue({main: datastoreCluster});
  }

  function setBaseFolderPath(path: string): void {
    component.form.get(component.Controls.BaseFolderPath).setValue({main: path});
  }

  it('should create the vSphere extended settings step', () => {
    expect(component).toBeTruthy();
  });

  it('should offer the folder paths as options of the base folder path', () => {
    component['_loadFolders']([{path: '/DC/vm/team-b'}, {path: '/DC/vm/team-a'}]);
    fixture.detectChanges();

    expect(component.folderPaths).toEqual(['/DC/vm/team-b', '/DC/vm/team-a']);
    expect(baseFolderPathField().options).toEqual(['/DC/vm/team-b', '/DC/vm/team-a']);
  });

  it('should not cut off the long hint of the base folder path', () => {
    expect(baseFolderPathField().subscriptSizing).toBe('dynamic');
  });

  it('should write the base folder path to the cluster spec', () => {
    setBaseFolderPath('/DC/vm/team-a');

    expect(clusterSpecService.cluster.spec.cloud.vsphere.basePath).toBe('/DC/vm/team-a');
  });

  it('should disable the folder selection while a base folder path is set', () => {
    const folder = component.form.get(component.Controls.Folder);
    expect(folder.disabled).toBe(false);

    setBaseFolderPath('/DC/vm/team-a');
    expect(folder.disabled).toBe(true);

    setBaseFolderPath('');
    expect(folder.disabled).toBe(false);
  });

  it('should offer the loaded datastore clusters as options of the datastore cluster', () => {
    component.datastoreClusters = ['/DC0/datastore/pod-a', '/DC0/datastore/pod-b'];
    fixture.detectChanges();

    expect(datastoreClusterField().options).toEqual(['/DC0/datastore/pod-a', '/DC0/datastore/pod-b']);
  });

  it('should write the datastore cluster to the cluster spec', () => {
    setDatastoreCluster('/DC0/datastore/pod-a');

    expect(clusterSpecService.cluster.spec.cloud.vsphere.datastoreCluster).toBe('/DC0/datastore/pod-a');
  });

  it('should disable the datastore while a datastore cluster is set', () => {
    const datastore = component.form.get(component.Controls.Datastore);
    expect(datastore.disabled).toBe(false);

    setDatastoreCluster('/DC0/datastore/pod-a');
    expect(datastore.disabled).toBe(true);

    setDatastoreCluster('');
    expect(datastore.disabled).toBe(false);
  });
});
