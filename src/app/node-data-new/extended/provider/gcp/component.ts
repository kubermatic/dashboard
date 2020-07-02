import {Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR} from '@angular/forms';
import {BaseFormValidator} from '../../../../shared/validators/base-form.validator';
import {NodeDataService} from '../../../service/service';

enum Controls {
  Tags = 'tags',
  Labels = 'labels',
}

@Component({
  selector: 'km-gcp-extended-node-data',
  templateUrl: './template.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => GCPExtendedNodeDataComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => GCPExtendedNodeDataComponent),
      multi: true,
    },
  ],
})
export class GCPExtendedNodeDataComponent extends BaseFormValidator implements OnInit, OnDestroy {
  labels: object;
  tags: string[];

  readonly Controls = Controls;

  constructor(private readonly _builder: FormBuilder, private readonly _nodeDataService: NodeDataService) {
    super();
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Labels]: this._builder.control(''),
      [Controls.Tags]: this._builder.control(''),
    });
  }

  onLabelsChange(labels: object): void {
    this._nodeDataService.gcp.labels = labels;
  }

  onTagsChange(tags: string[]): void {
    this._nodeDataService.gcp.tags = tags;
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }
}
