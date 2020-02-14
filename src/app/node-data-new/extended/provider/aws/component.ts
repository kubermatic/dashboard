import {Component, EventEmitter, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, NG_VALIDATORS, NG_VALUE_ACCESSOR} from '@angular/forms';
import {merge} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {NodeCloudSpec, NodeSpec} from '../../../../shared/entity/NodeEntity';
import {NodeData} from '../../../../shared/model/NodeSpecChange';
import {BaseFormValidator} from '../../../../shared/validators/base-form.validator';
import {NodeDataService} from '../../../service/service';

enum Controls {
  AssignPublicIP = 'assignPublicIP',
  Tags = 'tags',
}

@Component({
  selector: 'kubermatic-aws-extended-node-data',
  templateUrl: './template.html',
  providers: [
    {provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => AWSExtendedNodeDataComponent), multi: true},
    {provide: NG_VALIDATORS, useExisting: forwardRef(() => AWSExtendedNodeDataComponent), multi: true}
  ]
})
export class AWSExtendedNodeDataComponent extends BaseFormValidator implements OnInit, OnDestroy {
  form: FormGroup;

  readonly Control = Controls;

  private _tags: object;
  private _tagsChanges = new EventEmitter<object>();
  get tags(): object {
    return this._tags;
  }

  set tags(tags: object) {
    this._tags = tags;
    this._tagsChanges.emit(this._tags);
  }

  get nodeData(): NodeData {
    return this._service.nodeData;
  }

  constructor(private readonly _builder: FormBuilder, private readonly _service: NodeDataService) {
    super();
  }

  ngOnInit(): void {
    const isInEdit = !!this.nodeData.name;  // Existing node deployment will always have assigned name.
    const assignPublicIP = isInEdit ? this.nodeData.spec.cloud.aws.assignPublicIP : true;  // Default to true.

    this.form = this._builder.group({
      [Controls.AssignPublicIP]: this._builder.control(assignPublicIP),
      [Controls.Tags]: this._builder.control(''),
    });

    merge(this.form.get(Controls.AssignPublicIP).valueChanges, this._tagsChanges)
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(() => this._service.nodeData = this._getNodeData());
  }

  private _getNodeData(): NodeData {
    return {
      spec: {
        cloud: {
          aws: {
            assignPublicIP: this.form.get(Controls.AssignPublicIP).value,
            tags: this.tags,
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
