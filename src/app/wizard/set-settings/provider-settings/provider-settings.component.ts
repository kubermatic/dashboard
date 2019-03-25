import {Component, Input} from '@angular/core';
import {ClusterEntity} from '../../../shared/entity/ClusterEntity';

@Component({
  selector: 'kubermatic-cluster-provider-settings',
  templateUrl: './provider-settings.component.html',
})
export class ClusterProviderSettingsComponent {
  @Input() cluster: ClusterEntity;
}
