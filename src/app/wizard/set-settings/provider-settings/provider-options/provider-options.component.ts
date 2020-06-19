import {Component, Input} from '@angular/core';
import {Cluster} from '../../../../shared/entity/cluster';

@Component({
  selector: 'km-cluster-provider-options',
  templateUrl: './provider-options.component.html',
})
export class ClusterProviderOptionsComponent {
  @Input() cluster: Cluster;
}
