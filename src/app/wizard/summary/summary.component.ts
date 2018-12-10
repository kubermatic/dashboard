import {Component, Input, OnInit} from '@angular/core';
import {ClusterEntity} from '../../shared/entity/ClusterEntity';
import {SSHKeyEntity} from '../../shared/entity/SSHKeyEntity';
import {getIpCount} from '../../shared/functions/get-ip-count';
import {ClusterDatacenterForm, ClusterProviderForm} from '../../shared/model/ClusterForm';
import {NodeData} from '../../shared/model/NodeSpecChange';
import {NodeUtils} from '../../shared/utils/node-utils/node-utils';

@Component({
  selector: 'kubermatic-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.scss'],
})
export class SummaryComponent implements OnInit {
  @Input() clusterSSHKeys: SSHKeyEntity[];
  @Input() nodeData: NodeData;
  @Input() cluster: ClusterEntity;
  @Input() providerFormData: ClusterProviderForm;
  @Input() datacenterFormData: ClusterDatacenterForm;
  noMoreIpsLeft = false;

  ngOnInit(): void {
    if (!!this.cluster.spec.machineNetworks) {
      this.noMoreIpsLeft = this.noIpsLeft(this.cluster, this.nodeData.count);
    }
  }

  getOperatingSystem(): string {
    if (this.cluster.name.endsWith('openshift') || this.cluster.spec.cloud.openshift) {
      return 'CentOS';
    } else {
      return NodeUtils.getOperatingSystem(this.nodeData.spec);
    }
  }

  displayTags(tags: object): boolean {
    return Object.keys(tags).length > 0;
  }

  getTagsFromObject(tags: object): string {
    let tagsValue = '';
    let counter = 0;
    for (const i in tags) {
      if (tags.hasOwnProperty(i)) {
        counter++;
        if (counter === 1) {
          tagsValue += (i + ': ' + tags[i]);
        } else {
          tagsValue += (', ' + i + ': ' + tags[i]);
        }
      }
    }
    return tagsValue;
  }

  getDnsServers(dnsServers: string[]): string {
    return dnsServers.join(', ');
  }

  noIpsLeft(cluster: ClusterEntity, nodeCount: number): boolean {
    const ipCount = getIpCount(cluster);

    if (!!ipCount && ipCount > 0) {
      return !((ipCount - nodeCount) >= 0);
    } else {
      return false;
    }
  }

  mapKubernetesToOpenShiftVersion(version: string): string {
    if (version.startsWith('1.11')) {
      return '3.11';
    } else if (version.startsWith('1.10')) {
      return '3.10';
    } else {
      return '3.9';
    }
  }
}
