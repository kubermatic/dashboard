import {Component, Input} from '@angular/core';
import {ClusterEntity} from '../../../shared/entity/ClusterEntity';
import {SSHKeyEntity} from '../../../shared/entity/SSHKeyEntity';

@Component({
  selector: 'km-cluster-provider-settings',
  templateUrl: './provider-settings.component.html',
})
export class ClusterProviderSettingsComponent {
  @Input() cluster: ClusterEntity;
  @Input() clusterSSHKeys: SSHKeyEntity[] = [];

  constructor() {}

  isInWizard(): boolean {
    return !this.cluster.id || this.cluster.id === '';
  }
}
