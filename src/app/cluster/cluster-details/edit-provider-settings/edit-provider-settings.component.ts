import {Component, Input} from '@angular/core';
import {Cluster} from '../../../shared/entity/cluster';

@Component({
  selector: 'km-edit-provider-settings',
  templateUrl: './edit-provider-settings.component.html',
})
export class EditProviderSettingsComponent {
  @Input() cluster: Cluster;

  constructor() {}
}
