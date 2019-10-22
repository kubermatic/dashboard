import {Component, Input} from '@angular/core';
import {ClusterEntity} from '../../../../shared/entity/ClusterEntity';

@Component({
  selector: 'kubermatic-cluster-provider-options',
  templateUrl: './provider-options.component.html',
})
export class ClusterProviderOptionsComponent {
  @Input() cluster: ClusterEntity;
}
