import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ClusterEntity } from '../../shared/entity/ClusterEntity';
import { WizardService } from '../../core/services/wizard/wizard.service';
import { SSHKeyEntity } from '../../shared/entity/SSHKeyEntity';
import {NodeEntity} from '../../shared/entity/NodeEntity';
import {NodeData} from '../../shared/model/NodeSpecChange';

@Component({
  selector: 'kubermatic-set-settings',
  templateUrl: './set-settings.component.html',
  styleUrls: ['./set-settings.component.scss']
})
export class SetSettingsComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  @Input() clusterSSHKeys: SSHKeyEntity[] = [];
  @Input() nodeData: NodeData;

  constructor(private wizardService: WizardService) { }

  ngOnInit() { }

  ngOnDestroy() { }
}
