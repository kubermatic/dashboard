import {Component, Input, OnDestroy, OnInit, SimpleChanges} from '@angular/core';
import {FormArray, FormControl, FormGroup, Validators} from '@angular/forms';
import {iif, Subject} from 'rxjs';
import {debounceTime, distinctUntilChanged, first, takeUntil} from 'rxjs/operators';

import {ApiService, WizardService} from '../../core/services';
import {NodeDataService} from '../../core/services/node-data/node-data.service';
import {CloudSpec} from '../../shared/entity/ClusterEntity';
import {GCPMachineSize} from '../../shared/entity/provider/gcp/GCP';
import {NodeProvider} from '../../shared/model/NodeProviderConstants';
import {NodeData, NodeProviderData} from '../../shared/model/NodeSpecChange';

@Component({
  selector: 'kubermatic-gcp-node-data',
  templateUrl: './gcp-node-data.component.html',
  styleUrls: ['./gcp-node-data.component.scss'],
})

export class GCPNodeDataComponent implements OnInit, OnDestroy {
  @Input() cloudSpec: CloudSpec;
  @Input() nodeData: NodeData;
  @Input() projectId: string;
  @Input() clusterId: string;
  @Input() seedDCName: string;

  diskTypes: string[] = this._wizardService.provider(NodeProvider.GCP).diskTypes();
  machineTypes: GCPMachineSize[] = [];
  zones: string[] = this._wizardService.provider(NodeProvider.GCP).zones();
  form: FormGroup;
  labels: FormArray;
  hideOptional = true;
  loadingSizes = false;

  private _selectedCredentials: string;
  private _unsubscribe: Subject<any> = new Subject();

  constructor(
      private readonly _nodeDataService: NodeDataService, private readonly _wizardService: WizardService,
      private readonly _apiService: ApiService) {}

  ngOnInit(): void {
    const labelList = new FormArray([]);
    for (const i in this.nodeData.spec.cloud.gcp.labels) {
      if (this.nodeData.spec.cloud.gcp.labels.hasOwnProperty(i)) {
        labelList.push(new FormGroup({
          key: new FormControl(i),
          value: new FormControl(this.nodeData.spec.cloud.gcp.labels[i]),
        }));
      }
    }

    this.form = new FormGroup({
      diskSize: new FormControl(this.nodeData.spec.cloud.gcp.diskSize, Validators.required),
      diskType: new FormControl(this.nodeData.spec.cloud.gcp.diskType, Validators.required),
      machineType:
          new FormControl({value: this.nodeData.spec.cloud.gcp.machineType, disabled: true}, Validators.required),
      zone: new FormControl(this.nodeData.spec.cloud.gcp.zone, Validators.required),
      preemptible: new FormControl(this.nodeData.spec.cloud.gcp.preemptible),
      tags: new FormControl(this.nodeData.spec.cloud.gcp.tags.toString().replace(/\,/g, ', ')),
      labels: labelList,
    });

    if (this.nodeData.spec.cloud.gcp.diskType === '') {
      this.form.controls.diskType.setValue(this.diskTypes[0]);
    }

    this.form.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
      this._nodeDataService.changeNodeProviderData(this.getNodeProviderData());
    });

    this._wizardService.clusterSettingsFormViewChanged$.pipe(takeUntil(this._unsubscribe)).subscribe((data) => {
      this.hideOptional = data.hideOptional;
    });

    this._nodeDataService.changeNodeProviderData(this.getNodeProviderData());

    this._wizardService.clusterProviderSettingsFormChanges$.pipe(takeUntil(this._unsubscribe)).subscribe((data) => {
      this.cloudSpec = data.cloudSpec;
      this.disableSizes();
      this.reloadSizes();
    });

    this._wizardService.onCustomPresetSelect.pipe(takeUntil(this._unsubscribe)).subscribe(credentials => {
      this._selectedCredentials = credentials;
    });

    this.form.controls.zone.valueChanges.pipe(debounceTime(1000), distinctUntilChanged(), takeUntil(this._unsubscribe))
        .subscribe(value => {
          this.nodeData.spec.cloud.gcp.zone = value;
          this.reloadSizes();
        });

    this.reloadSizes();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.cloudSpec && !changes.cloudSpec.firstChange) {
      if (!changes.cloudSpec.previousValue ||
          (changes.cloudSpec.currentValue.gcp.serviceAccount !== changes.cloudSpec.previousValue.gcp.serviceAccount)) {
        this.reloadSizes();
      }
    }
  }

  disableSizes(): void {
    this.loadingSizes = false;
    this.machineTypes = [];
    this.form.controls.machineType.setValue('');
    this.form.controls.machineType.disable();
  }

  enableSizes(data: GCPMachineSize[]): void {
    this.loadingSizes = false;
    this.form.controls.machineType.enable();
    this.machineTypes = data;
    if (this.machineTypes.length > 0) {
      if (this.nodeData.spec.cloud.gcp.machineType !== '' &&
          this.machineTypes.filter(value => value.name === this.nodeData.spec.cloud.gcp.machineType).length > 0) {
        this.form.controls.machineType.setValue(this.nodeData.spec.cloud.gcp.machineType);
      } else {
        this.form.controls.machineType.setValue(this.machineTypes[0].name);
      }
    }
  }

  isInWizard(): boolean {
    return !this.clusterId || this.clusterId.length === 0;
  }

  getSizeHint(): string {
    if (this.machineTypes.length > 0) {
      return '';
    }

    if (this.isInWizard() && !this.loadingSizes && !this.nodeData.spec.cloud.gcp.zone &&
        !(this.cloudSpec.gcp.serviceAccount || this._selectedCredentials)) {
      return 'Please enter valid service account and zone first.';
    } else if (
        this.isInWizard() && !this.loadingSizes && !(this.cloudSpec.gcp.serviceAccount || this._selectedCredentials)) {
      return 'Please enter valid service account first.';
    } else if (!this.loadingSizes && !this.nodeData.spec.cloud.gcp.zone) {
      return 'Please enter valid zone first.';
    } else if (this.loadingSizes) {
      return 'Loading sizes...';
    } else {
      return '';
    }
  }

  reloadSizes(zone = this.nodeData.spec.cloud.gcp.zone): void {
    if (!(this.cloudSpec.gcp.serviceAccount || this._selectedCredentials || !this.isInWizard()) || !zone) {
      return;
    }

    this.loadingSizes = true;

    iif(() => this.isInWizard(),
        this._wizardService.provider(NodeProvider.GCP)
            .zone(zone)
            .serviceAccount(this.cloudSpec.gcp.serviceAccount)
            .credential(this._selectedCredentials)
            .machineTypes(),
        this._apiService.getGCPSizes(zone, this.projectId, this.seedDCName, this.clusterId))
        .pipe(first())
        .pipe(takeUntil(this._unsubscribe))
        .subscribe((data) => {
          this.loadingSizes = false;
          this.enableSizes(data);
        }, () => this.disableSizes());
  }

  getNodeProviderData(): NodeProviderData {
    const labelsMap = {};
    for (const i in this.form.controls.labels.value) {
      if (this.form.controls.labels.value[i].key !== '' && this.form.controls.labels.value[i].value !== '') {
        labelsMap[this.form.controls.labels.value[i].key] = this.form.controls.labels.value[i].value;
      }
    }

    let gcpTags: string[] = [];
    if ((this.form.controls.tags.value).length > 0) {
      gcpTags = (this.form.controls.tags.value).split(',').map(tag => tag.trim());
      gcpTags.map(tag => tag.trim());
    }

    return {
      spec: {
        gcp: {
          diskSize: this.form.controls.diskSize.value,
          diskType: this.form.controls.diskType.value,
          machineType: this.form.controls.machineType.value,
          preemptible: this.form.controls.preemptible.value,
          zone: this.form.controls.zone.value,
          labels: labelsMap,
          tags: gcpTags,
        },
      },
      valid: this.form.valid,
    };
  }

  getLabelForm(form): any {
    return form.get('labels').controls;
  }

  addLabel(): void {
    this.labels = this.form.get('labels') as FormArray;
    this.labels.push(new FormGroup({
      key: new FormControl(''),
      value: new FormControl(''),
    }));
  }

  deleteLabel(index: number): void {
    const arrayControl = this.form.get('labels') as FormArray;
    arrayControl.removeAt(index);
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }
}
