import {Component, Input} from '@angular/core';
import {Cluster} from '../../../shared/entity/cluster';
import {SSHKey} from '../../../shared/entity/ssh-key';

@Component({
  selector: 'km-cluster-provider-settings',
  templateUrl: './provider-settings.component.html',
})
export class ClusterProviderSettingsComponent {
  @Input() cluster: Cluster;
  @Input() clusterSSHKeys: SSHKey[] = [];

  constructor() {}

  isInWizard(): boolean {
    return !this.cluster.id || this.cluster.id === '';
  }
}
