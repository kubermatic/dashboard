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

import {Component, Input, OnInit} from '@angular/core';
import {SettingsService} from '@app/core/services/settings';
import {AdminSettings} from '@app/shared/entity/settings';
import {getVisibleAnnotations} from '@app/shared/utils/annotations';
import {ApplicationsListView} from '@shared/components/application-list/component';
import {LabelFormComponent} from '@shared/components/label-form/component';
import {Application} from '@shared/entity/application';
import {Cluster} from '@shared/entity/cluster';
import {Datacenter, SeedSettings} from '@shared/entity/datacenter';
import {MachineDeployment, OPERATING_SYSTEM_PROFILE_ANNOTATION} from '@shared/entity/machine-deployment';
import {VSphereTag, getOperatingSystem, getOperatingSystemLogoClass} from '@shared/entity/node';
import {KubeVirtNodeInstanceType, KubeVirtNodePreference} from '@shared/entity/provider/kubevirt';
import {SSHKey} from '@shared/entity/ssh-key';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {AdmissionPlugin, AdmissionPluginUtils} from '@shared/utils/admission-plugin';
import {convertArrayToObject} from '@shared/utils/common';
import _ from 'lodash';
import {take} from 'rxjs/operators';

@Component({
  selector: 'km-cluster-summary',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  standalone: false,
})
export class ClusterSummaryComponent implements OnInit {
  readonly ApplicationsListView = ApplicationsListView;

  @Input() cluster: Cluster;
  @Input() machineDeployment: MachineDeployment;
  @Input() datacenter: Datacenter;
  @Input() seedSettings: SeedSettings;
  @Input() applications: Application[];
  @Input() flipLayout = false;
  @Input() clusterTemplateEditMode = false;

  operatingSystemProfileAnnotation = OPERATING_SYSTEM_PROFILE_ANNOTATION;
  adminSettings: AdminSettings;

  private _sshKeys: SSHKey[] = [];

  @Input()
  set sshKeys(keys: string[]) {
    this._sshKeys = keys?.map(key => ({name: key}) as SSHKey);
  }

  get provider(): NodeProvider {
    const providers = Object.values(NodeProvider)
      .map(provider => (this.cluster.spec.cloud[provider] ? provider : undefined))
      .filter(p => p !== undefined);
    return providers.length > 0 ? providers[0] : NodeProvider.NONE;
  }

  get admissionPlugins(): string[] {
    return Object.keys(AdmissionPlugin);
  }

  get hasAdmissionPlugins(): boolean {
    return !_.isEmpty(this.cluster.spec.admissionPlugins);
  }

  get operatingSystem(): string {
    return getOperatingSystem(this.machineDeployment.spec.template);
  }

  get operatingSystemLogoClass(): string {
    return getOperatingSystemLogoClass(this.machineDeployment.spec.template);
  }

  get operatingSystemProfile(): string {
    return this.machineDeployment.annotations?.[this.operatingSystemProfileAnnotation];
  }

  get isMLAEnabled(): boolean {
    return this.seedSettings?.mla?.user_cluster_mla_enabled;
  }

  get hasNetworkConfiguration(): boolean {
    return !_.isEmpty(this.cluster.spec?.cniPlugin) || !_.isEmpty(this.cluster.spec?.clusterNetwork);
  }

  get nodePortsAllowedIPRanges(): string[] {
    return this.cluster.spec?.cloud[this.provider]?.nodePortsAllowedIPRanges?.cidrBlocks;
  }

  get showIPv4(): boolean {
    const clusterNetwork = this.cluster.spec.clusterNetwork;

    return (
      this.isDualStackNetworkSelected &&
      !!(
        clusterNetwork?.pods?.cidrBlocks?.length ||
        clusterNetwork?.services?.cidrBlocks?.length ||
        clusterNetwork?.nodeCidrMaskSizeIPv4
      )
    );
  }

  get showIPv6(): boolean {
    const clusterNetwork = this.cluster.spec.clusterNetwork;

    return (
      this.isDualStackNetworkSelected &&
      !!(
        clusterNetwork?.pods?.cidrBlocks?.length > 1 ||
        clusterNetwork?.services?.cidrBlocks?.length > 1 ||
        clusterNetwork?.nodeCidrMaskSizeIPv6
      )
    );
  }

  private get isDualStackNetworkSelected(): boolean {
    return Cluster.isDualStackNetworkSelected(this.cluster);
  }

  constructor(private readonly _settingsService: SettingsService) {}

  ngOnInit(): void {
    this._settingsService.adminSettings.pipe(take(1)).subscribe((settings: AdminSettings) => {
      this.adminSettings = settings;
    });
  }

  isAdmissionPluginEnabled(plugin: string): boolean {
    return this.cluster?.spec?.admissionPlugins?.includes(plugin) || false;
  }

  getAdmissionPluginName(plugin: string): string {
    return AdmissionPluginUtils.getPluginName(plugin);
  }

  getSSHKeys(): SSHKey[] {
    return this._sshKeys;
  }

  getApplicationsCounterClass(): string {
    let counter = 5;
    const bringyourownStepsCount = 3;
    if (this.cluster.spec.cloud?.bringyourown) {
      counter = bringyourownStepsCount;
    }

    if (this.clusterTemplateEditMode || this.cluster.spec.cloud?.edge) {
      counter--;
    }

    return `counter-${counter}`;
  }

  displaySettings(): boolean {
    return Object.values(NodeProvider).some(p => this._hasProviderOptions(p));
  }

  displayTags(tags: Record<string, string>): boolean {
    return !!tags && !_.isEmpty(Object.keys(LabelFormComponent.filterNullifiedKeys(tags)));
  }

  // Note: VSphereNodeSpec has list of tags: VSphereTag which requires explicit
  // conversion array into object form to pass onto `km-labels` component as Input
  convertVSphereTagsIntoObject(tags: Array<VSphereTag>): VSphereTag | {} {
    return convertArrayToObject(tags, 'name', 'description');
  }

  getKubeVirtInstanceTypeCategory(instanceType: KubeVirtNodeInstanceType): string {
    return KubeVirtNodeInstanceType.getCategory(instanceType);
  }

  getKubeVirtPreferenceCategory(preference: KubeVirtNodePreference): string {
    return KubeVirtNodePreference.getCategory(preference);
  }

  getFilteredAnnotations(annotations: Record<string, string>): Record<string, string> {
    return getVisibleAnnotations(annotations, this.adminSettings);
  }

  private _hasProviderOptions(provider: NodeProvider): boolean {
    return (
      this.provider === provider &&
      this.cluster.spec.cloud[provider] &&
      Object.values(this.cluster.spec.cloud[provider]).some(val => val)
    );
  }
}
