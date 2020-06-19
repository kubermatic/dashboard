import {Component, Input} from '@angular/core';
import {Cluster} from '../../../shared/entity/cluster';
import {NodeData} from '../../../shared/model/NodeSpecChange';

@Component({
  selector: 'km-extended-options',
  templateUrl: './extended-options.component.html',
  styleUrls: ['./extended-options.component.scss'],
})
export class ExtendedOptionsComponent {
  @Input() cluster: Cluster;
  @Input() nodeData: NodeData;
  @Input() isExtended: boolean;

  isInWizard(): boolean {
    return !this.cluster.id || this.cluster.id === '';
  }
}
