import {Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR} from '@angular/forms';
import {merge} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {NodeCloudSpec, NodeSpec} from '../../../../shared/entity/node';
import {NodeData} from '../../../../shared/model/NodeSpecChange';
import {BaseFormValidator} from '../../../../shared/validators/base-form.validator';
import {NodeDataService} from '../../../service/service';

enum Controls {
  Backups = 'backups',
  IPv6 = 'ipv6',
  Monitoring = 'monitoring',
  Tags = 'tags',
}

@Component({
  selector: 'km-digitalocean-extended-node-data',
  templateUrl: './template.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DigitalOceanExtendedNodeDataComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => DigitalOceanExtendedNodeDataComponent),
      multi: true,
    },
  ],
})
export class DigitalOceanExtendedNodeDataComponent extends BaseFormValidator implements OnInit, OnDestroy {
  tags: string[] = [];

  readonly Controls = Controls;

  get nodeData(): NodeData {
    return this._nodeDataService.nodeData;
  }

  constructor(private readonly _builder: FormBuilder, private readonly _nodeDataService: NodeDataService) {
    super();
  }

  ngOnInit(): void {
    const backups = this._nodeDataService.isInDialogEditMode() ? this.nodeData.spec.cloud.digitalocean.backups : false;
    const ipv6 = this._nodeDataService.isInDialogEditMode() ? this.nodeData.spec.cloud.digitalocean.ipv6 : false;
    const monitoring = this._nodeDataService.isInDialogEditMode()
      ? this.nodeData.spec.cloud.digitalocean.monitoring
      : false;

    this.form = this._builder.group({
      [Controls.Backups]: this._builder.control(backups),
      [Controls.IPv6]: this._builder.control(ipv6),
      [Controls.Monitoring]: this._builder.control(monitoring),
      [Controls.Tags]: this._builder.control(''),
    });

    this._nodeDataService.nodeData = this._getNodeData();

    merge(
      this.form.get(Controls.Backups).valueChanges,
      this.form.get(Controls.IPv6).valueChanges,
      this.form.get(Controls.Monitoring).valueChanges
    )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => (this._nodeDataService.nodeData = this._getNodeData()));
  }

  onTagsChange(tags: string[]): void {
    this._nodeDataService.digitalOcean.tags = tags;
  }

  private _getNodeData(): NodeData {
    return {
      spec: {
        cloud: {
          digitalocean: {
            backups: this.form.get(Controls.Backups).value,
            ipv6: this.form.get(Controls.IPv6).value,
            monitoring: this.form.get(Controls.Monitoring).value,
          },
        } as NodeCloudSpec,
      } as NodeSpec,
    } as NodeData;
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }
}
