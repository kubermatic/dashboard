import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {NodeDataService} from '../../../core/services/node-data/node-data.service';
import {NodeData, NodeProviderData} from '../../../shared/model/NodeSpecChange';

@Component({
  selector: 'kubermatic-digitalocean-node-options',
  templateUrl: './digitalocean-node-options.component.html',
  styleUrls: ['./digitalocean-node-options.component.scss'],
})

export class DigitaloceanNodeOptionsComponent implements OnInit, OnDestroy {
  @Input() nodeData: NodeData;
  @Input() isInWizard: boolean;
  form: FormGroup;
  private _unsubscribe = new Subject<void>();

  constructor(private addNodeService: NodeDataService) {}

  ngOnInit(): void {
    this.form = new FormGroup({
      backups: new FormControl(this.nodeData.spec.cloud.digitalocean.backups),
      ipv6: new FormControl(this.nodeData.spec.cloud.digitalocean.ipv6),
      monitoring: new FormControl(this.nodeData.spec.cloud.digitalocean.monitoring),
      tags: new FormControl(this.nodeData.spec.cloud.digitalocean.tags.toString().replace(/,/g, ', ')),
    });
    this.form.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
      this.addNodeService.changeNodeProviderData(this.getDoOptionsData());
    });

    this.addNodeService.changeNodeProviderData(this.getDoOptionsData());
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getDoOptionsData(): NodeProviderData {
    let doTags: string[] = [];
    if ((this.form.controls.tags.value).length > 0) {
      doTags = (this.form.controls.tags.value).split(',').map(tag => tag.trim());
      doTags.map(tag => tag.trim());
    }

    return {
      spec: {
        digitalocean: {
          size: this.nodeData.spec.cloud.digitalocean.size,
          backups: this.form.controls.backups.value,
          ipv6: this.form.controls.ipv6.value,
          monitoring: this.form.controls.monitoring.value,
          tags: doTags,
        },
      },
      valid: this.nodeData.valid,
    };
  }
}
