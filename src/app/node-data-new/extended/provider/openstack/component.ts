import {Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR} from '@angular/forms';
import {BaseFormValidator} from '../../../../shared/validators/base-form.validator';
import {NodeDataService} from '../../../service/service';

enum Controls {
  Tags = 'tags',
}

@Component({
  selector: 'km-openstack-extended-node-data',
  templateUrl: './template.html',
  providers: [
    {provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => OpenstackExtendedNodeDataComponent), multi: true},
    {provide: NG_VALIDATORS, useExisting: forwardRef(() => OpenstackExtendedNodeDataComponent), multi: true}
  ]
})
export class OpenstackExtendedNodeDataComponent extends BaseFormValidator implements OnInit, OnDestroy {
  tags: object;

  readonly Controls = Controls;

  constructor(private readonly _builder: FormBuilder, private readonly _nodeDataService: NodeDataService) {
    super();
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Tags]: this._builder.control(''),
    });
  }

  onTagsChange(tags: object): void {
    this._nodeDataService.openstack.tags = tags;
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }
}
