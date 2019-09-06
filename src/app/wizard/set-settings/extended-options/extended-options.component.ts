import {Component, Input} from '@angular/core';
import {ClusterEntity} from '../../../shared/entity/ClusterEntity';
import {NodeData} from '../../../shared/model/NodeSpecChange';

@Component({
  selector: 'kubermatic-extended-options',
  templateUrl: './extended-options.component.html',
  styleUrls: ['./extended-options.component.scss'],
})
export class ExtendedOptionsComponent {
  @Input() cluster: ClusterEntity;
  @Input() nodeData: NodeData;

  isInWizard(): boolean {
    return !this.cluster.id || this.cluster.id === '';
  }
}
