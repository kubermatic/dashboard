import {Component, Input, OnInit} from '@angular/core';
import * as _ from 'lodash';

import {LabelFormComponent} from '../../shared/components/label-form/label-form.component';
import {Cluster} from '../../shared/entity/cluster';
import {SSHKey} from '../../shared/entity/ssh-key';
import {getIpCount} from '../../shared/functions/get-ip-count';
import {ClusterDatacenterForm, ClusterProviderForm} from '../../shared/model/ClusterForm';
import {NodeData} from '../../shared/model/NodeSpecChange';
import {getOperatingSystem, getOperatingSystemLogoClass} from '../../shared/entity/node';
import {AdmissionPluginUtils} from '../../shared/utils/admission-plugin-utils/admission-plugin-utils';
@Component({
  selector: 'km-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.scss'],
})
export class SummaryComponent implements OnInit {
  @Input() clusterSSHKeys: SSHKey[];
  @Input() nodeData: NodeData;
  @Input() cluster: Cluster;
  @Input() providerFormData: ClusterProviderForm;
  @Input() datacenterFormData: ClusterDatacenterForm;
  noMoreIpsLeft = false;

  ngOnInit(): void {
    if (this.cluster.spec.machineNetworks) {
      this.noMoreIpsLeft = this.noIpsLeft(this.cluster, this.nodeData.count);
    }
  }

  getOperatingSystem(): string {
    return getOperatingSystem(this.nodeData.spec);
  }

  getOperatingSystemLogoClass(): string {
    return getOperatingSystemLogoClass(this.nodeData.spec);
  }

  displayProvider(): boolean {
    return (
      !!this.cluster.spec.cloud.digitalocean ||
      !!this.cluster.spec.cloud.hetzner ||
      !!this.cluster.spec.cloud.bringyourown ||
      !!this.cluster.spec.cloud.alibaba ||
      (!!this.cluster.spec.cloud.aws && !this.hasAWSProviderOptions()) ||
      (!!this.cluster.spec.cloud.gcp && !this.hasGCPProviderOptions()) ||
      (!!this.cluster.spec.cloud.azure && !this.hasAzureProviderOptions())
    );
  }

  hasAWSProviderOptions(): boolean {
    return (
      this.cluster.spec.cloud.aws.securityGroupID !== '' ||
      this.cluster.spec.cloud.aws.vpcId !== '' ||
      this.cluster.spec.cloud.aws.vpcId !== '' ||
      this.cluster.spec.cloud.aws.routeTableId !== '' ||
      this.cluster.spec.cloud.aws.instanceProfileName !== '' ||
      this.cluster.spec.cloud.aws.roleARN !== ''
    );
  }

  hasGCPProviderOptions(): boolean {
    return this.cluster.spec.cloud.gcp.network !== '' || this.cluster.spec.cloud.gcp.subnetwork !== '';
  }

  hasAzureProviderOptions(): boolean {
    return (
      this.cluster.spec.cloud.azure.resourceGroup !== '' ||
      this.cluster.spec.cloud.azure.routeTable !== '' ||
      this.cluster.spec.cloud.azure.securityGroup !== '' ||
      this.cluster.spec.cloud.azure.subnet !== '' ||
      this.cluster.spec.cloud.azure.vnet !== ''
    );
  }

  displayTags(tags: object): boolean {
    return !!tags && Object.keys(LabelFormComponent.filterNullifiedKeys(tags)).length > 0;
  }

  displayNoProviderTags(): boolean {
    if (this.nodeData.spec.cloud.aws) {
      return !this.displayTags(this.nodeData.spec.cloud.aws.tags);
    } else if (this.nodeData.spec.cloud.digitalocean) {
      return this.nodeData.spec.cloud.digitalocean.tags.length === 0;
    } else if (this.nodeData.spec.cloud.gcp) {
      return this.nodeData.spec.cloud.gcp.tags.length === 0;
    } else if (this.nodeData.spec.cloud.packet) {
      return this.nodeData.spec.cloud.packet.tags.length === 0;
    } else if (this.nodeData.spec.cloud.openstack) {
      return !this.displayTags(this.nodeData.spec.cloud.openstack.tags);
    } else if (this.nodeData.spec.cloud.azure) {
      return !this.displayTags(this.nodeData.spec.cloud.azure.tags);
    }
    return false;
  }

  getDnsServers(dnsServers: string[]): string {
    return dnsServers.join(', ');
  }

  getSSHKeyNames(): string {
    return this.clusterSSHKeys.map(key => key.name).join(', ');
  }

  noIpsLeft(cluster: Cluster, nodeCount: number): boolean {
    const ipCount = getIpCount(cluster.spec.machineNetworks);

    if (!!ipCount && ipCount > 0) {
      return !(ipCount - nodeCount >= 0);
    }
    return false;
  }

  hasAdmissionPlugins(): boolean {
    return !_.isEmpty(this.cluster.spec.admissionPlugins);
  }

  getAdmissionPlugins(): string {
    return AdmissionPluginUtils.getJoinedPluginNames(this.cluster.spec.admissionPlugins);
  }
}
