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

import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {BrowserModule} from '@angular/platform-browser';
import {SharedModule} from '@shared/module';
import {GlobalModule} from '@core/services/global/module';
import {NodeDataComponent} from './component';
import {NodeDataService} from '@core/services/node-data/service';
import {ClusterSpecService} from '@core/services/cluster-spec';
import {SettingsService} from '@core/services/settings';
import {ProjectService} from '@core/services/project';
import {DatacenterService} from '@core/services/datacenter';
import {ApplicationService} from '@core/services/application';
import {OperatingSystemManagerService} from '@core/services/operating-system-manager';
import {ParamsService} from '@app/core/services/params';
import {QuotaCalculationService} from '@dynamic/enterprise/quotas/services/quota-calculation';
import {LabelService} from '@core/services/label';
import {NameGeneratorService} from '@core/services/name-generator';
import {NODE_DATA_CONFIG, NodeDataMode} from './config';
import {SettingsMockService} from '@test/services/settings-mock';
import {ProjectMockService} from '@test/services/project-mock';
import {DatacenterMockService} from '@test/services/datacenter-mock';
import {WizardMode} from '@app/wizard/types/wizard-mode';
import {NodeProvider, OperatingSystem} from '@shared/model/NodeProviderConstants';
import {ActivatedRoute} from '@angular/router';
import {MatDialog} from '@angular/material/dialog';
import {MatDialogMock} from '@test/services/mat-dialog-mock';
import {ActivatedRouteMock} from '@test/services/activate-route-mock';
import {EventEmitter, NO_ERRORS_SCHEMA} from '@angular/core';
import {NodeData} from '@shared/model/NodeSpecChange';
import {DEFAULT_ADMIN_SETTINGS_MOCK} from '@test/services/settings-mock';
import {fakeProject} from '@test/data/project';
import {of, EMPTY, BehaviorSubject} from 'rxjs';
import {HttpClientTestingModule} from '@angular/common/http/testing';

function createNodeDataServiceMock() {
  return {
    nodeData: NodeData.NewEmptyNodeData(),
    operatingSystem: undefined,
    operatingSystemSpec: {},
    nodeDataChanges: new BehaviorSubject(NodeData.NewEmptyNodeData()),
    isInWizardMode: () => true,
    kubeVirt: {osImageVersion$: new BehaviorSubject('')},
    set labels(_: any) {},
    set annotations(_: any) {},
    set taints(_: any) {},
    set machineDeploymentLabels(_: any) {},
    set machineDeploymentAnnotations(_: any) {},
    set network(_: any) {},
  };
}

function sharedProviders() {
  return [
    ClusterSpecService,
    LabelService,
    NameGeneratorService,
    ParamsService,
    OperatingSystemManagerService,
    {provide: NODE_DATA_CONFIG, useValue: {mode: NodeDataMode.Wizard}},
    {
      provide: ApplicationService,
      useValue: {
        applications: [],
        applicationChanges: new EventEmitter(),
        getApplicationDefinition: () => of({} as any),
        list: () => of([]),
      },
    },
    {
      provide: QuotaCalculationService,
      useValue: {
        calculationInProgress: of(false),
        refreshQuotaExceed: () => {},
        refreshQuotaCalculations: () => {},
        getQuotaCalculations: () => EMPTY,
        reset: () => {},
        quotaPayload: {},
      },
    },
    {provide: ActivatedRoute, useClass: ActivatedRouteMock},
    {provide: MatDialog, useClass: MatDialogMock},
  ];
}

describe('NodeDataComponent', () => {
  let component: NodeDataComponent;
  let fixture: ComponentFixture<NodeDataComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, HttpClientTestingModule, SharedModule, GlobalModule],
      declarations: [NodeDataComponent],
      providers: [
        ...sharedProviders(),
        {provide: NodeDataService, useValue: createNodeDataServiceMock()},
        {provide: SettingsService, useClass: SettingsMockService},
        {provide: ProjectService, useClass: ProjectMockService},
        {provide: DatacenterService, useClass: DatacenterMockService},
      ],
      schemas: [NO_ERRORS_SCHEMA],
      teardown: {destroyAfterEach: false},
    })
      .overrideComponent(NodeDataComponent, {
        set: {template: '<div></div>'},
      })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NodeDataComponent);
    component = fixture.componentInstance;
    component.provider = NodeProvider.AWS;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('isOperatingSystemSupported', () => {
    it('should support Ubuntu on AWS', () => {
      component.provider = NodeProvider.AWS;
      expect(component.isOperatingSystemSupported(OperatingSystem.Ubuntu)).toBe(true);
    });

    it('should not support Ubuntu on ANEXIA', () => {
      component.provider = NodeProvider.ANEXIA;
      expect(component.isOperatingSystemSupported(OperatingSystem.Ubuntu)).toBe(false);
    });

    it('should only support AmazonLinux2 on AWS', () => {
      component.provider = NodeProvider.AWS;
      expect(component.isOperatingSystemSupported(OperatingSystem.AmazonLinux2)).toBe(true);
      component.provider = NodeProvider.GCP;
      expect(component.isOperatingSystemSupported(OperatingSystem.AmazonLinux2)).toBe(false);
    });

    it('should support RHEL on AWS, AZURE, KUBEVIRT, OPENSTACK, VSPHERE', () => {
      for (const p of [
        NodeProvider.AWS,
        NodeProvider.AZURE,
        NodeProvider.KUBEVIRT,
        NodeProvider.OPENSTACK,
        NodeProvider.VSPHERE,
      ]) {
        component.provider = p;
        expect(component.isOperatingSystemSupported(OperatingSystem.RHEL)).toBe(true);
      }
    });

    it('should not support RHEL on DIGITALOCEAN', () => {
      component.provider = NodeProvider.DIGITALOCEAN;
      expect(component.isOperatingSystemSupported(OperatingSystem.RHEL)).toBe(false);
    });

    it('should support Flatcar on ANEXIA', () => {
      component.provider = NodeProvider.ANEXIA;
      expect(component.isOperatingSystemSupported(OperatingSystem.Flatcar)).toBe(true);
    });

    it('should not support RockyLinux on GCP', () => {
      component.provider = NodeProvider.GCP;
      expect(component.isOperatingSystemSupported(OperatingSystem.RockyLinux)).toBe(false);
    });

    it('should support RockyLinux on HETZNER', () => {
      component.provider = NodeProvider.HETZNER;
      expect(component.isOperatingSystemSupported(OperatingSystem.RockyLinux)).toBe(true);
    });
  });

  describe('isOperatingSystemSelected', () => {
    it('should return true when the selected OS matches', () => {
      component.form.get('operatingSystem').setValue(OperatingSystem.Ubuntu);
      expect(component.isOperatingSystemSelected(OperatingSystem.Ubuntu)).toBe(true);
    });

    it('should return true when the selected OS is in the list', () => {
      component.form.get('operatingSystem').setValue(OperatingSystem.Flatcar);
      expect(component.isOperatingSystemSelected(OperatingSystem.Ubuntu, OperatingSystem.Flatcar)).toBe(true);
    });

    it('should return false when the selected OS does not match', () => {
      component.form.get('operatingSystem').setValue(OperatingSystem.RHEL);
      expect(component.isOperatingSystemSelected(OperatingSystem.Ubuntu)).toBe(false);
    });
  });

  describe('isTemplateEditOrCustomize', () => {
    it('should be true for EditClusterTemplate', () => {
      component.wizardMode = WizardMode.EditClusterTemplate;
      component.isTemplateEditOrCustomize = true;
      expect(component.isTemplateEditOrCustomize).toBe(true);
    });

    it('should be true for CustomizeClusterTemplate', () => {
      component.wizardMode = WizardMode.CustomizeClusterTemplate;
      component.isTemplateEditOrCustomize = true;
      expect(component.isTemplateEditOrCustomize).toBe(true);
    });

    it('should be false for CreateUserCluster', () => {
      component.wizardMode = WizardMode.CreateUserCluster;
      component.isTemplateEditOrCustomize = false;
      expect(component.isTemplateEditOrCustomize).toBe(false);
    });

    it('should be false for CreateClusterTemplate', () => {
      component.wizardMode = WizardMode.CreateClusterTemplate;
      component.isTemplateEditOrCustomize = false;
      expect(component.isTemplateEditOrCustomize).toBe(false);
    });
  });

  describe('displayQuotaInWizard', () => {
    it('should return true for CustomizeClusterTemplate', () => {
      component.wizardMode = WizardMode.CustomizeClusterTemplate;
      expect(component.displayQuotaInWizard).toBe(true);
    });

    it('should return true for CreateUserCluster', () => {
      component.wizardMode = WizardMode.CreateUserCluster;
      expect(component.displayQuotaInWizard).toBe(true);
    });

    it('should return false for EditClusterTemplate', () => {
      component.wizardMode = WizardMode.EditClusterTemplate;
      expect(component.displayQuotaInWizard).toBe(false);
    });

    it('should return false for CreateClusterTemplate', () => {
      component.wizardMode = WizardMode.CreateClusterTemplate;
      expect(component.displayQuotaInWizard).toBe(false);
    });
  });

  describe('isOperatingSystemAllowed', () => {
    beforeEach(() => {
      component.allowedOperatingSystems = {
        ubuntu: false,
        amzn2: true,
        rhel: true,
        flatcar: true,
        rockylinux: true,
      };
    });

    it('should allow a supported and allowed OS in create mode', () => {
      component.wizardMode = WizardMode.CreateUserCluster;
      component.dialogEditMode = false;
      component.allowedOperatingSystems = {
        ...component.allowedOperatingSystems,
        ubuntu: true,
      };
      expect(component.isOperatingSystemAllowed(OperatingSystem.Ubuntu)).toBe(true);
    });

    it('should disallow a disabled OS in create cluster mode', () => {
      component.wizardMode = WizardMode.CreateUserCluster;
      component.dialogEditMode = false;
      expect(component.isOperatingSystemAllowed(OperatingSystem.Ubuntu)).toBe(false);
    });

    it('should disallow a disabled OS in create template mode', () => {
      component.wizardMode = WizardMode.CreateClusterTemplate;
      component.dialogEditMode = false;
      expect(component.isOperatingSystemAllowed(OperatingSystem.Ubuntu)).toBe(false);
    });

    it('should allow a disabled OS in edit template mode if it is the current OS', () => {
      component.wizardMode = WizardMode.EditClusterTemplate;
      component.isTemplateEditOrCustomize = true;
      component.dialogEditMode = false;
      component.currentNodeOS = OperatingSystem.Ubuntu;
      expect(component.isOperatingSystemAllowed(OperatingSystem.Ubuntu)).toBe(true);
    });

    it('should allow a disabled OS in customize template mode if it is the current OS', () => {
      component.wizardMode = WizardMode.CustomizeClusterTemplate;
      component.isTemplateEditOrCustomize = true;
      component.dialogEditMode = false;
      component.currentNodeOS = OperatingSystem.Ubuntu;
      expect(component.isOperatingSystemAllowed(OperatingSystem.Ubuntu)).toBe(true);
    });

    it('should allow a disabled OS in dialog edit mode if it is the current OS', () => {
      component.dialogEditMode = true;
      component.currentNodeOS = OperatingSystem.Ubuntu;
      expect(component.isOperatingSystemAllowed(OperatingSystem.Ubuntu)).toBe(true);
    });

    it('should not allow a disabled OS in template edit mode if it is not the current OS', () => {
      component.wizardMode = WizardMode.EditClusterTemplate;
      component.isTemplateEditOrCustomize = true;
      component.dialogEditMode = false;
      component.currentNodeOS = OperatingSystem.Flatcar;
      expect(component.isOperatingSystemAllowed(OperatingSystem.Ubuntu)).toBe(false);
    });

    it('should not allow an unsupported OS even if it is the current OS in template edit mode', () => {
      component.wizardMode = WizardMode.EditClusterTemplate;
      component.isTemplateEditOrCustomize = true;
      component.provider = NodeProvider.ANEXIA;
      component.currentNodeOS = OperatingSystem.Ubuntu;
      expect(component.isOperatingSystemAllowed(OperatingSystem.Ubuntu)).toBe(false);
    });
  });
});

describe('NodeDataComponent - OS settings merging', () => {
  let component: NodeDataComponent;
  let fixture: ComponentFixture<NodeDataComponent>;
  let adminSettings$: BehaviorSubject<any>;
  let selectedProject$: BehaviorSubject<any>;

  beforeEach(waitForAsync(() => {
    adminSettings$ = new BehaviorSubject({
      ...DEFAULT_ADMIN_SETTINGS_MOCK,
      allowedOperatingSystems: {ubuntu: true, amzn2: true, rhel: true, flatcar: true, rockylinux: true},
    });

    selectedProject$ = new BehaviorSubject(fakeProject());

    TestBed.configureTestingModule({
      imports: [BrowserModule, HttpClientTestingModule, SharedModule, GlobalModule],
      declarations: [NodeDataComponent],
      providers: [
        ...sharedProviders(),
        {provide: NodeDataService, useValue: createNodeDataServiceMock()},
        {provide: SettingsService, useValue: {adminSettings: adminSettings$}},
        {provide: ProjectService, useValue: {selectedProject: selectedProject$}},
        {provide: DatacenterService, useClass: DatacenterMockService},
      ],
      schemas: [NO_ERRORS_SCHEMA],
      teardown: {destroyAfterEach: false},
    })
      .overrideComponent(NodeDataComponent, {
        set: {template: '<div></div>'},
      })
      .compileComponents();
  }));

  function initComponent(): void {
    fixture = TestBed.createComponent(NodeDataComponent);
    component = fixture.componentInstance;
    component.provider = NodeProvider.AWS;
    fixture.detectChanges();
  }

  it('should use admin settings when project has no OS restrictions', () => {
    adminSettings$.next({
      ...DEFAULT_ADMIN_SETTINGS_MOCK,
      allowedOperatingSystems: {ubuntu: true, amzn2: true, rhel: false, flatcar: true, rockylinux: true},
    });
    initComponent();
    expect(component.allowedOperatingSystems['ubuntu']).toBe(true);
    expect(component.allowedOperatingSystems['rhel']).toBe(false);
  });

  it('should narrow OS when project disables an admin-allowed OS', () => {
    adminSettings$.next({
      ...DEFAULT_ADMIN_SETTINGS_MOCK,
      allowedOperatingSystems: {ubuntu: true, amzn2: true, rhel: true, flatcar: true, rockylinux: true},
    });
    const project = fakeProject();
    project.spec = {allowedOperatingSystems: {ubuntu: false, amzn2: true, rhel: true, flatcar: true, rockylinux: true}};
    selectedProject$.next(project);
    initComponent();
    expect(component.allowedOperatingSystems['ubuntu']).toBe(false);
    expect(component.allowedOperatingSystems['amzn2']).toBe(true);
  });

  it('should not widen OS when project allows an admin-disabled OS', () => {
    adminSettings$.next({
      ...DEFAULT_ADMIN_SETTINGS_MOCK,
      allowedOperatingSystems: {ubuntu: false, amzn2: true, rhel: true, flatcar: true, rockylinux: true},
    });
    const project = fakeProject();
    project.spec = {allowedOperatingSystems: {ubuntu: true, amzn2: true, rhel: true, flatcar: true, rockylinux: true}};
    selectedProject$.next(project);
    initComponent();
    // Admin disabled ubuntu — project cannot re-enable it
    expect(component.allowedOperatingSystems['ubuntu']).toBe(false);
  });

  it('should disable OS not specified in project settings', () => {
    adminSettings$.next({
      ...DEFAULT_ADMIN_SETTINGS_MOCK,
      allowedOperatingSystems: {ubuntu: true, amzn2: true, rhel: true, flatcar: true, rockylinux: true},
    });
    const project = fakeProject();
    project.spec = {allowedOperatingSystems: {ubuntu: true}}; // rest default to false
    selectedProject$.next(project);
    initComponent();
    expect(component.allowedOperatingSystems['ubuntu']).toBe(true);
    expect(component.allowedOperatingSystems['amzn2']).toBe(false);
    expect(component.allowedOperatingSystems['flatcar']).toBe(false);
  });

  it('should allow all admin-enabled OS when project spec is empty', () => {
    adminSettings$.next({
      ...DEFAULT_ADMIN_SETTINGS_MOCK,
      allowedOperatingSystems: {ubuntu: true, amzn2: false, rhel: true, flatcar: false, rockylinux: true},
    });
    initComponent();
    expect(component.allowedOperatingSystems['ubuntu']).toBe(true);
    expect(component.allowedOperatingSystems['amzn2']).toBe(false);
    expect(component.allowedOperatingSystems['rhel']).toBe(true);
    expect(component.allowedOperatingSystems['flatcar']).toBe(false);
    expect(component.allowedOperatingSystems['rockylinux']).toBe(true);
  });

  it('should treat undefined project OS entries as false', () => {
    adminSettings$.next({
      ...DEFAULT_ADMIN_SETTINGS_MOCK,
      allowedOperatingSystems: {ubuntu: true, amzn2: true, rhel: true, flatcar: true, rockylinux: true},
    });
    const project = fakeProject();
    project.spec = {allowedOperatingSystems: {ubuntu: true, amzn2: undefined}};
    selectedProject$.next(project);
    initComponent();
    expect(component.allowedOperatingSystems['amzn2']).toBe(false);
    expect(component.allowedOperatingSystems['ubuntu']).toBe(true);
  });
});
