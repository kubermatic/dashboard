import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {iif, Subject} from 'rxjs';
import {first, takeUntil} from 'rxjs/operators';

import {ApiService, WizardService} from '../../core/services';
import {NodeDataService} from '../../core/services/node-data/node-data.service';
import {CloudSpec} from '../../shared/entity/ClusterEntity';
import {PacketSize} from '../../shared/entity/packet/PacketSizeEntity';
import {NodeProvider} from '../../shared/model/NodeProviderConstants';
import {NodeData, NodeProviderData} from '../../shared/model/NodeSpecChange';

@Component({
  selector: 'kubermatic-packet-node-data',
  templateUrl: './packet-node-data.component.html',
})

export class PacketNodeDataComponent implements OnInit, OnDestroy {
  @Input() cloudSpec: CloudSpec;
  @Input() nodeData: NodeData;
  @Input() projectId: string;
  @Input() clusterId: string;
  @Input() seedDCName: string;

  sizes: PacketSize[] = [];
  form: FormGroup;
  hideOptional = true;
  loadingSizes = false;

  private _unsubscribe: Subject<any> = new Subject();
  private _selectedCredentials: string;

  constructor(
      private readonly _addNodeService: NodeDataService, private readonly _wizard: WizardService,
      private readonly _api: ApiService) {}

  ngOnInit(): void {
    this.form = new FormGroup({
      size: new FormControl(this.nodeData.spec.cloud.packet.instanceType, Validators.required),
      tags: new FormControl(this.nodeData.spec.cloud.packet.tags.toString().replace(/\,/g, ', ')),
    });

    this.form.valueChanges.pipe(takeUntil(this._unsubscribe))
        .subscribe(() => this._addNodeService.changeNodeProviderData(this._getNodeProviderData()));

    this._wizard.clusterSettingsFormViewChanged$.pipe(takeUntil(this._unsubscribe)).subscribe((data) => {
      this.hideOptional = data.hideOptional;
    });

    this._wizard.clusterProviderSettingsFormChanges$.pipe(takeUntil(this._unsubscribe)).subscribe((data) => {
      this.cloudSpec = data.cloudSpec;
      this.form.controls.size.setValue('');
      this.sizes = [];
      this._checkSizeState();

      if (this._canLoadSizes()) {
        this._reloadPacketSizes();
      }
    });

    this._wizard.onCustomPresetSelect.pipe(takeUntil(this._unsubscribe)).subscribe(credentials => {
      this._selectedCredentials = credentials;
    });

    this._checkSizeState();
    this._reloadPacketSizes();
    this._addNodeService.changeNodeProviderData(this._getNodeProviderData());
  }

  isInWizard(): boolean {
    return !this.clusterId || this.clusterId.length === 0;
  }

  getSizesFormState(): string {
    if (!this.loadingSizes && (!this.cloudSpec.packet.apiKey || !this.cloudSpec.packet.projectID) &&
        this.isInWizard()) {
      return 'Plan*';
    } else if (this.loadingSizes) {
      return 'Loading Plans...';
    } else if (!this.loadingSizes && this.sizes.length === 0) {
      return 'No Plans available';
    } else {
      return 'Plan*';
    }
  }

  getPlanDetails(size: PacketSize): string {
    let description = '';
    size.drives = size.drives ? size.drives : [];
    size.cpus = size.cpus ? size.cpus : [];

    for (const cpu of size.cpus) {
      description += `${cpu.count} CPU(s) ${cpu.type}`;
    }

    if (size.memory && size.memory !== 'N/A') {
      description += `, ${size.memory} RAM`;
    }

    for (const drive of size.drives) {
      description += `, ${drive.count}x${drive.size} ${drive.type}`;
    }

    return description ? `(${description})` : '';
  }

  showSizeHint(): boolean {
    return !this._canLoadSizes() && this.isInWizard();
  }

  private _getNodeProviderData(): NodeProviderData {
    let packetTags: string[] = [];
    if ((this.form.controls.tags.value).length > 0) {
      packetTags = (this.form.controls.tags.value).split(',').map(tag => tag.trim());
    }

    return {
      spec: {
        packet: {
          instanceType: this.form.controls.size.value,
          tags: packetTags,
        },
      },
      valid: this.form.valid,
    };
  }

  private _reloadPacketSizes(): void {
    if (this._canLoadSizes() || !this.isInWizard()) {
      this.loadingSizes = true;
    }

    iif(() => this.isInWizard(),
        this._wizard.provider(NodeProvider.PACKET)
            .apiKey(this.cloudSpec.packet.apiKey)
            .projectID(this.cloudSpec.packet.projectID)
            .credential(this._selectedCredentials)
            .flavors(),
        this._api.getPacketSizes(this.projectId, this.seedDCName, this.clusterId))
        .pipe(first())
        .pipe(takeUntil(this._unsubscribe))
        .subscribe((sizes: PacketSize[]) => {
          this.sizes = sizes;
          if (this.nodeData.spec.cloud.packet.instanceType === '' && this.sizes.length) {
            this.form.controls.size.setValue(this.sizes[0].name);
          }

          this.loadingSizes = false;
          this._checkSizeState();
        }, () => this.loadingSizes = false);
  }

  private _checkSizeState(): void {
    if (this.sizes.length === 0) {
      this.form.controls.size.disable();
    } else {
      this.form.controls.size.enable();
    }
  }

  private _canLoadSizes(): boolean {
    return (!!this.cloudSpec.packet.apiKey && !!this.cloudSpec.packet.projectID) || !!this._selectedCredentials;
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }
}
