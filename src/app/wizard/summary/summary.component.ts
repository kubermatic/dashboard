
import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {ClusterEntity} from '../../shared/entity/ClusterEntity';
import {SSHKeyEntity} from '../../shared/entity/SSHKeyEntity';
import {ClusterDatacenterForm, ClusterProviderForm} from '../../shared/model/ClusterForm';
import {NodeData} from '../../shared/model/NodeSpecChange';

@Component({
  selector: 'kubermatic-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.scss'],
})
export class SummaryComponent implements OnInit, OnDestroy {
  @Input() clusterSSHKeys: SSHKeyEntity[];
  @Input() nodeData: NodeData;
  @Input() cluster: ClusterEntity;
  @Input() providerFormData: ClusterProviderForm;
  @Input() datacenterFormData: ClusterDatacenterForm;
  noMoreIpsLeft = false;

  constructor() {}

  ngOnInit(): void {
    if (!!this.cluster.spec.machineNetworks) {
      this.noMoreIpsLeft = this.noIpsLeft(this.cluster, this.nodeData.count);
      console.log('NO IPS LEFT', this.noIpsLeft);
    }
  }

  ngOnDestroy(): void {}

  getOperatingSystem(): string {
    if (this.nodeData.spec.operatingSystem.ubuntu) {
      return 'Ubuntu';

    } else if (this.nodeData.spec.operatingSystem.centos) {
      return 'CentOS';

    } else if (this.nodeData.spec.operatingSystem.containerLinux) {
      return 'Container Linux';
    } else {
      return '';
    }
  }

  displayTags(tags: object): boolean {
    if (Object.keys(tags).length > 0) {
      return true;
    } else {
      return false;
    }
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
    // tslint:disable
    const ip4ToInt = (ip) => ip.split('.').reduce((int, oct) => (int << 8) + parseInt(oct, 10), 0) >>> 0;

    const isIp4InCidr = (ip, cidr) => {
      const [range, bits = 32] = cidr.split('/');
      const mask = ~(2 ** (32 - bits) - 1);
      return (ip4ToInt(ip) & mask) === (ip4ToInt(range) & mask);
    };
    // tslint:enable
    let ipCount = 0;

    for (const i in cluster.spec.machineNetworks) {
      if (cluster.spec.machineNetworks.hasOwnProperty(i)) {
        const isInCidr = isIp4InCidr(cluster.spec.machineNetworks[i].gateway, cluster.spec.machineNetworks[i].cidr);
        const cidr = +cluster.spec.machineNetworks[i].cidr.split('/')[1];
        if (isInCidr) {
          ipCount += (2 ** (32 - cidr)) - 3;
        } else {
          ipCount += (2 ** (32 - cidr)) - 2;
        }
      }
    }

    if (!!ipCount && ipCount > 0) {
      if ((ipCount - nodeCount) >= 0) {
        return false;
      } else {
        return true;
      }
    }
  }
}
