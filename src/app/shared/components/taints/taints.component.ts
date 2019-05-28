import {Component, Input} from '@angular/core';
import {Taint} from '../../entity/NodeEntity';

@Component({
  selector: 'km-taints',
  templateUrl: './taints.component.html',
})
export class TaintsComponent {
  @Input() taints: Taint[] = [];
}
