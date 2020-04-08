import {Component, Input} from '@angular/core';
import {ClusterEntity} from '../../../shared/entity/ClusterEntity';

@Component({
  selector: 'km-edit-provider-settings',
  templateUrl: './edit-provider-settings.component.html',
})

export class EditProviderSettingsComponent {
  @Input() cluster: ClusterEntity;

  constructor() {}
}
