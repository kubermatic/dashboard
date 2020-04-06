import {Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR} from '@angular/forms';
import {takeUntil} from 'rxjs/operators';
import {AzureNodeSpec} from '../../../../shared/entity/node/AzureNodeSpec';
import {NodeCloudSpec, NodeSpec} from '../../../../shared/entity/NodeEntity';
import {NodeData} from '../../../../shared/model/NodeSpecChange';
import {BaseFormValidator} from '../../../../shared/validators/base-form.validator';
import {NodeDataService} from '../../../service/service';

enum Controls {
  AssignPublicIP = 'assignPublicIP',
  Tags = 'tags',
}

@Component({
  selector: 'km-azure-extended-node-data',
  templateUrl: './template.html',
  providers: [
    {provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => AzureExtendedNodeDataComponent), multi: true},
    {provide: NG_VALIDATORS, useExisting: forwardRef(() => AzureExtendedNodeDataComponent), multi: true}
  ]
})
export class AzureExtendedNodeDataComponent extends BaseFormValidator implements OnInit, OnDestroy {
  tags: object;

  readonly Control = Controls;

  get nodeData(): NodeData {
    return this._nodeDataService.nodeData;
  }

  constructor(private readonly _builder: FormBuilder, private readonly _nodeDataService: NodeDataService) {
    super();
  }

  ngOnInit(): void {
    const assignPublicIP =
        this._nodeDataService.isInDialogEditMode() ? this.nodeData.spec.cloud.aws.assignPublicIP : true;

    this.form = this._builder.group({
      [Controls.AssignPublicIP]: this._builder.control(assignPublicIP),
      [Controls.Tags]: this._builder.control(''),
    });

    this._nodeDataService.nodeData = this._getNodeData();

    this.form.get(Controls.AssignPublicIP)
        .valueChanges.pipe(takeUntil(this._unsubscribe))
        .subscribe(_ => this._nodeDataService.nodeData = this._getNodeData());

    this.form.get(Controls.Tags)
        .valueChanges.pipe(takeUntil(this._unsubscribe))
        .subscribe(_ => this._nodeDataService.azure.tags = this.tags);
  }

  onTagsChange(tags: object): void {
    this.tags = tags;
  }

  private _getNodeData(): NodeData {
    return {
      spec: {
        cloud: {
          azure: {
            assignPublicIP: this.form.get(Controls.AssignPublicIP).value,
          } as AzureNodeSpec,
        } as NodeCloudSpec,
      } as NodeSpec,
    } as NodeData;
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }
}
