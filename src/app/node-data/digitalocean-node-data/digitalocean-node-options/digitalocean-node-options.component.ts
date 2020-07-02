import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {WizardService} from '../../../core/services';
import {NodeDataService} from '../../../core/services/node-data/node-data.service';
import {NodeData, NodeProviderData} from '../../../shared/model/NodeSpecChange';

@Component({
  selector: 'km-digitalocean-node-options',
  templateUrl: './digitalocean-node-options.component.html',
  styleUrls: ['./digitalocean-node-options.component.scss'],
})
export class DigitaloceanNodeOptionsComponent implements OnInit, OnDestroy {
  @Input() nodeData: NodeData;
  @Input() isInWizard: boolean;

  hideOptional = true;
  form: FormGroup;

  private _unsubscribe = new Subject<void>();

  constructor(private addNodeService: NodeDataService, private readonly _wizardService: WizardService) {}

  ngOnInit(): void {
    this.form = new FormGroup({
      backups: new FormControl(this.nodeData.spec.cloud.digitalocean.backups),
      ipv6: new FormControl(this.nodeData.spec.cloud.digitalocean.ipv6),
      monitoring: new FormControl(this.nodeData.spec.cloud.digitalocean.monitoring),
    });

    this.form.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
      this.addNodeService.changeNodeProviderData(this.getDoOptionsData());
    });

    this.addNodeService.changeNodeProviderData(this.getDoOptionsData());

    this._wizardService.clusterSettingsFormViewChanged$.pipe(takeUntil(this._unsubscribe)).subscribe(data => {
      this.hideOptional = data.hideOptional;
    });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getDoOptionsData(): NodeProviderData {
    return {
      spec: {
        digitalocean: {
          size: this.nodeData.spec.cloud.digitalocean.size,
          backups: this.form.controls.backups.value,
          ipv6: this.form.controls.ipv6.value,
          monitoring: this.form.controls.monitoring.value,
          tags: this.nodeData.spec.cloud.digitalocean.tags,
        },
      },
      valid: this.nodeData.valid,
    };
  }
}
