import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormArray, FormControl, FormGroup} from '@angular/forms';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {WizardService} from '../../../core/services';
import {NodeDataService} from '../../../core/services/node-data/node-data.service';
import {NodeData, NodeProviderData} from '../../../shared/model/NodeSpecChange';

@Component({
  selector: 'kubermatic-packet-node-options',
  templateUrl: './packet-node-options.component.html',
})

export class PacketNodeOptionsComponent implements OnInit, OnDestroy {
  @Input() nodeData: NodeData;

  hideOptional = true;
  form: FormGroup;
  labels: FormArray;
  private _unsubscribe: Subject<any> = new Subject();

  constructor(private readonly _nodeDataService: NodeDataService, private readonly _wizardService: WizardService) {}

  ngOnInit(): void {
    this.form = new FormGroup({
      tags: new FormControl(this.nodeData.spec.cloud.packet.tags.toString().replace(/\,/g, ', ')),
    });

    this.form.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
      this._nodeDataService.changeNodeProviderData(this.getNodeProviderData());
    });

    this._wizardService.clusterSettingsFormViewChanged$.pipe(takeUntil(this._unsubscribe)).subscribe((data) => {
      this.hideOptional = data.hideOptional;
    });

    this._nodeDataService.changeNodeProviderData(this.getNodeProviderData());
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getNodeProviderData(): NodeProviderData {
    let packetTags: string[] = [];
    if ((this.form.controls.tags.value).length > 0) {
      packetTags = (this.form.controls.tags.value).split(',').map(tag => tag.trim());
      packetTags.map(tag => tag.trim());
    }

    return {
      spec: {
        packet: {
          instanceType: this.nodeData.spec.cloud.packet.instanceType,
          tags: packetTags,
        },
      },
      valid: this.nodeData.valid,
    };
  }
}
