import {Component, Input, OnInit} from '@angular/core';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {WizardService, DatacenterService} from '../../core/services';
import {ClusterEntity} from '../../shared/entity/ClusterEntity';
import {DataCenterEntity} from '../../shared/entity/DatacenterEntity';
import {SSHKeyEntity} from '../../shared/entity/SSHKeyEntity';
import {NodeData} from '../../shared/model/NodeSpecChange';

@Component({
  selector: 'km-set-settings',
  templateUrl: './set-settings.component.html',
  styleUrls: ['./set-settings.component.scss'],
})
export class SetSettingsComponent implements OnInit {
  @Input() cluster: ClusterEntity;
  @Input() clusterSSHKeys: SSHKeyEntity[] = [];
  @Input() nodeData: NodeData;
  isExtended = false;
  seedDc: DataCenterEntity;
  private _unsubscribe = new Subject<void>();

  constructor(private wizardService: WizardService, private _dc: DatacenterService) {}

  ngOnInit(): void {
    this._dc
      .getDatacenter(this.cluster.spec.cloud.dc)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(dc => {
        this.seedDc = dc;
      });
  }

  extend(): void {
    this.isExtended = !this.isExtended;
    this.wizardService.changeSettingsFormView({hideOptional: !this.isExtended});
  }
}
