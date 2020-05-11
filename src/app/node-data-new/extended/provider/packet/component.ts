import {Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR} from '@angular/forms';
import {NodeData} from '../../../../shared/model/NodeSpecChange';
import {BaseFormValidator} from '../../../../shared/validators/base-form.validator';
import {NodeDataService} from '../../../service/service';

enum Controls {
  Tags = 'tags',
}

@Component({
  selector: 'km-packet-extended-node-data',
  templateUrl: './template.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PacketExtendedNodeDataComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => PacketExtendedNodeDataComponent),
      multi: true,
    },
  ],
})
export class PacketExtendedNodeDataComponent extends BaseFormValidator
  implements OnInit, OnDestroy {
  tags: string[] = [];

  readonly Controls = Controls;

  get nodeData(): NodeData {
    return this._nodeDataService.nodeData;
  }

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _nodeDataService: NodeDataService
  ) {
    super();
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Tags]: this._builder.control(''),
    });
  }

  onTagsChange(tags: string[]): void {
    this._nodeDataService.packet.tags = tags;
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }
}
