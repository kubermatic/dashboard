import {Component, Input, OnInit} from '@angular/core';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {WizardService, DatacenterService} from '../../core/services';
import {Cluster} from '../../shared/entity/cluster';
import {SSHKey} from '../../shared/entity/ssh-key';
import {NodeData} from '../../shared/model/NodeSpecChange';

@Component({
  selector: 'km-set-settings',
  templateUrl: './set-settings.component.html',
  styleUrls: ['./set-settings.component.scss'],
})
export class SetSettingsComponent implements OnInit {
  @Input() cluster: Cluster;
  @Input() clusterSSHKeys: SSHKey[] = [];
  @Input() nodeData: NodeData;
  isExtended = false;
  seed: string;
  private _unsubscribe = new Subject<void>();

  constructor(private wizardService: WizardService, private _dc: DatacenterService) {}

  ngOnInit(): void {
    this._dc
      .getDatacenter(this.cluster.spec.cloud.dc)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(dc => (this.seed = dc.spec.seed));
  }

  extend(): void {
    this.isExtended = !this.isExtended;
    this.wizardService.changeSettingsFormView({hideOptional: !this.isExtended});
  }
}
