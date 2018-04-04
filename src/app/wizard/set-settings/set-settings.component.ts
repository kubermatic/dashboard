import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ClusterEntity } from '../../shared/entity/ClusterEntity';
import { WizardService } from '../../core/services/wizard/wizard.service';
import { SSHKeyEntity } from '../../shared/entity/SSHKeyEntity';

@Component({
  selector: 'kubermatic-set-settings',
  templateUrl: './set-settings.component.html',
  styleUrls: ['./set-settings.component.scss']
})
export class SetSettingsComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  @Input() clusterSSHKeys: SSHKeyEntity[] = [];

  constructor(private wizardService: WizardService) { }

  ngOnInit() { }

  ngOnDestroy() { }
}
