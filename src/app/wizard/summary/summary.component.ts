import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { NodeData } from '../../shared/model/NodeSpecChange';
import { SSHKeyEntity } from '../../shared/entity/SSHKeyEntity';
import { ClusterEntity } from '../../shared/entity/ClusterEntity';
import { ClusterDatacenterForm, ClusterProviderForm } from '../../shared/model/ClusterForm';

@Component({
  selector: 'kubermatic-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.scss']
})
export class SummaryComponent implements OnInit, OnDestroy {
  @Input() clusterSSHKeys: SSHKeyEntity[];
  @Input() nodeData: NodeData;
  @Input() cluster: ClusterEntity;
  @Input() providerFormData: ClusterProviderForm;
  @Input() datacenterFormData: ClusterDatacenterForm;

  constructor() { }

  ngOnInit() { }

  ngOnDestroy() { }

  getOperatingSystem(): string {
    if (this.nodeData.node.spec.operatingSystem.ubuntu) {
      return 'Ubuntu';
    } else if (this.nodeData.node.spec.operatingSystem.centos) {
      return 'CentOS';
    } else if (this.nodeData.node.spec.operatingSystem.containerLinux) {
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

}
