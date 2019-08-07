import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {iif, Subject} from 'rxjs';
import {first, takeUntil} from 'rxjs/operators';
import {ApiService, WizardService} from '../../core/services';
import {NodeDataService} from '../../core/services/node-data/node-data.service';
import {CloudSpec} from '../../shared/entity/ClusterEntity';
import {HetznerTypes} from '../../shared/entity/provider/hetzner/TypeEntity';
import {NodeProvider} from '../../shared/model/NodeProviderConstants';
import {NodeData, NodeProviderData} from '../../shared/model/NodeSpecChange';

@Component({
  selector: 'kubermatic-hetzner-node-data',
  templateUrl: './hetzner-node-data.component.html',
})

export class HetznerNodeDataComponent implements OnInit, OnDestroy {
  @Input() cloudSpec: CloudSpec;
  @Input() nodeData: NodeData;
  @Input() projectId: string;
  @Input() clusterId: string;
  @Input() seedDCName: string;

  types: HetznerTypes = {dedicated: [], standard: []};
  hetznerNodeForm: FormGroup;
  loadingTypes = false;
  private _unsubscribe = new Subject<void>();
  private _selectedCredentials: string;

  constructor(
      private readonly _apiService: ApiService, private readonly _addNodeService: NodeDataService,
      private readonly _wizardService: WizardService) {}

  ngOnInit(): void {
    this.hetznerNodeForm = new FormGroup({
      type: new FormControl(this.nodeData.spec.cloud.hetzner.type, Validators.required),
    });

    this.hetznerNodeForm.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
      this._addNodeService.changeNodeProviderData(this.getNodeProviderData());
    });

    this._wizardService.clusterProviderSettingsFormChanges$.pipe(takeUntil(this._unsubscribe)).subscribe((data) => {
      this.cloudSpec = data.cloudSpec;
      this.hetznerNodeForm.controls.type.setValue('');
      this.types = {dedicated: [], standard: []};
      this.checkTypeState();

      if (data.cloudSpec.hetzner.token !== '' || this._selectedCredentials) {
        this.reloadHetznerTypes();
      }
    });

    this._wizardService.onCustomPresetSelect.pipe(takeUntil(this._unsubscribe)).subscribe(credentials => {
      this._selectedCredentials = credentials;
    });

    this.checkTypeState();
    this.reloadHetznerTypes();
    this._addNodeService.changeNodeProviderData(this.getNodeProviderData());
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  isInWizard(): boolean {
    return !this.clusterId || this.clusterId.length === 0;
  }

  checkTypeState(): void {
    if (this.types.standard.length === 0 && this.types.dedicated.length === 0) {
      this.hetznerNodeForm.controls.type.disable();
    } else {
      this.hetznerNodeForm.controls.type.enable();
    }
  }

  getTypesFormState(): string {
    if ((!this.loadingTypes && (!this.cloudSpec.hetzner.token || this.cloudSpec.hetzner.token.length === 0)) &&
        this.isInWizard()) {
      return 'Node Type*';
    } else if (this.loadingTypes) {
      return 'Loading node types...';
    } else if (!this.loadingTypes && this.types.standard.length === 0 && this.types.dedicated.length === 0) {
      return 'No Node Types available';
    } else {
      return 'Node Type*';
    }
  }

  showSizeHint(): boolean {
    return (!this.loadingTypes && !this.cloudSpec.hetzner.token && !this._selectedCredentials) && this.isInWizard();
  }

  reloadHetznerTypes(): void {
    if (this.cloudSpec.hetzner.token || this._selectedCredentials || !this.isInWizard()) {
      this.loadingTypes = true;
    }

    iif(() => this.isInWizard(),
        this._wizardService.provider(NodeProvider.HETZNER)
            .token(this.cloudSpec.hetzner.token)
            .credential(this._selectedCredentials)
            .flavors(),
        this._apiService.getHetznerTypes(this.projectId, this.seedDCName, this.clusterId))
        .pipe(first())
        .pipe(takeUntil(this._unsubscribe))
        .subscribe((data) => {
          this.types = data;
          if (this.nodeData.spec.cloud.hetzner.type === '') {
            this.hetznerNodeForm.controls.type.setValue(this.types.standard[0].name);
          }

          this.loadingTypes = false;
          this.checkTypeState();
        }, () => this.loadingTypes = false);
  }

  getNodeProviderData(): NodeProviderData {
    return {
      spec: {
        hetzner: {
          type: this.hetznerNodeForm.controls.type.value,
        },
      },
      valid: this.hetznerNodeForm.valid,
    };
  }
}
