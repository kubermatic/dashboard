import {Component, Input, OnDestroy, OnInit, SimpleChanges} from '@angular/core';
import {FormArray, FormControl, FormGroup, Validators} from '@angular/forms';
import {iif, Subject} from 'rxjs';
import {debounceTime, distinctUntilChanged, first, takeUntil} from 'rxjs/operators';

import {ApiService, WizardService} from '../../core/services';
import {NodeDataService} from '../../core/services/node-data/node-data.service';
import {CloudSpec} from '../../shared/entity/ClusterEntity';
import {GCPDiskType, GCPMachineSize, GCPZone} from '../../shared/entity/provider/gcp/GCP';
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

  diskTypes: GCPDiskType[] = [];
  machineTypes: GCPMachineSize[] = [];
  zones: GCPZone[] = [];
  form: FormGroup;
  labels: FormArray;
  hideOptional = true;
  private _loadingZones = false;
  private _loadingDiskTypes = false;
  private _loadingSizes = false;
  private _selectedPreset: string;
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
      diskType: new FormControl({value: this.nodeData.spec.cloud.gcp.diskType, disabled: true}, Validators.required),
      machineType:
          new FormControl({value: this.nodeData.spec.cloud.gcp.machineType, disabled: true}, Validators.required),
      zone: new FormControl({value: this.nodeData.spec.cloud.gcp.zone, disabled: true}, Validators.required),
      preemptible: new FormControl(this.nodeData.spec.cloud.gcp.preemptible),
      tags: new FormControl(this.nodeData.spec.cloud.gcp.tags.toString().replace(/\,/g, ', ')),
      labels: labelList,
    });

    this.form.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
      this._nodeDataService.changeNodeProviderData(this.getNodeProviderData());
    });

    this._wizardService.clusterSettingsFormViewChanged$.pipe(takeUntil(this._unsubscribe)).subscribe((data) => {
      this.hideOptional = data.hideOptional;
    });

    this._nodeDataService.changeNodeProviderData(this.getNodeProviderData());

    this._wizardService.clusterProviderSettingsFormChanges$.pipe(takeUntil(this._unsubscribe)).subscribe((data) => {
      this.cloudSpec = data.cloudSpec;
      this._disableSizes();
      this._reloadSizes();
      this._disableDiskTypes();
      this._reloadDiskTypes();
      this._disableZones();
      this._reloadZones();
    });

    this._wizardService.onCustomPresetSelect.pipe(takeUntil(this._unsubscribe)).subscribe(credentials => {
      this._selectedPreset = credentials;
    });

    this.form.controls.zone.valueChanges.pipe(debounceTime(1000), distinctUntilChanged(), takeUntil(this._unsubscribe))
        .subscribe(value => {
          this.nodeData.spec.cloud.gcp.zone = value;
          this._reloadSizes();
          this._reloadDiskTypes();
        });

    this._reloadZones();
    this._reloadSizes();
    this._reloadDiskTypes();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.cloudSpec && !changes.cloudSpec.firstChange) {
      if (!changes.cloudSpec.previousValue ||
          (changes.cloudSpec.currentValue.gcp.serviceAccount !== changes.cloudSpec.previousValue.gcp.serviceAccount)) {
        this._reloadZones();
        this._reloadSizes();
        this._reloadDiskTypes();
      }
    }
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  isInWizard(): boolean {
    return !this.clusterId || this.clusterId.length === 0;
  }

  private _hasCredentials(): boolean {
    return !!this.cloudSpec.gcp.serviceAccount || !!this._selectedPreset || !this.isInWizard();
  }

  private _disableZones(): void {
    this._loadingZones = false;
    this.zones = [];
    this.form.controls.zone.setValue('');
    this.form.controls.zone.disable();
  }

  private _enableZones(data: GCPZone[]): void {
    this._loadingZones = false;
    this.form.controls.zone.enable();
    this.zones = data;
    if (this.zones.length > 0) {
      if (this.nodeData.spec.cloud.gcp.zone !== '' &&
          this.zones.filter(value => value.name === this.nodeData.spec.cloud.gcp.zone).length > 0) {
        this.form.controls.zone.setValue(this.nodeData.spec.cloud.gcp.zone);
      } else {
        this.form.controls.zone.setValue(this.zones[0].name);
      }
    }
  }

  getZoneHint(): string {
    if (this.zones.length > 0) {
      return '';
    }

    if (this.isInWizard() && !this._loadingZones && !(this.cloudSpec.gcp.serviceAccount || this._selectedPreset)) {
      return 'Please enter valid service account first.';
    } else if (this._loadingZones) {
      return `Loading zones...`;
    } else {
      return '';
    }
  }

  private _reloadZones(): void {
    if (!this._hasCredentials) {
      return;
    }

    this._loadingZones = true;
    iif(() => this.isInWizard(),
        this._wizardService.provider(NodeProvider.GCP)
            .serviceAccount(this.cloudSpec.gcp.serviceAccount)
            .credential(this._selectedPreset)
            .zones(this.cloudSpec.dc),
        this._apiService.getGCPZones(this.projectId, this.seedDCName, this.clusterId))
        .pipe(first())
        .pipe(takeUntil(this._unsubscribe))
        .subscribe((data) => {
          this._loadingZones = false;
          this._enableZones(data);
        }, () => this._disableZones());
  }



  private _disableDiskTypes(): void {
    this._loadingDiskTypes = false;
    this.diskTypes = [];
    this.form.controls.diskType.setValue('');
    this.form.controls.diskType.disable();
  }

  private _enableDiskTypes(data: GCPDiskType[]): void {
    this._loadingDiskTypes = false;
    this.form.controls.diskType.enable();
    this.diskTypes = data;
    if (this.diskTypes.length > 0) {
      if (this.nodeData.spec.cloud.gcp.diskType !== '' &&
          this.diskTypes.filter(value => value.name === this.nodeData.spec.cloud.gcp.diskType).length > 0) {
        this.form.controls.diskType.setValue(this.nodeData.spec.cloud.gcp.diskType);
      } else {
        this.form.controls.diskType.setValue(this.diskTypes[0].name);
      }
    }
  }

  getDiskTypeHint(): string {
    if (this.diskTypes.length > 0) {
      return '';
    }

    if (this.isInWizard() && !this._loadingDiskTypes && !this.nodeData.spec.cloud.gcp.zone &&
        !(this.cloudSpec.gcp.serviceAccount || this._selectedPreset)) {
      return 'Please enter valid service account and zone first.';
    } else if (
        this.isInWizard() && !this._loadingDiskTypes && !(this.cloudSpec.gcp.serviceAccount || this._selectedPreset)) {
      return 'Please enter valid service account first.';
    } else if (!this._loadingDiskTypes && !this.nodeData.spec.cloud.gcp.zone) {
      return 'Please enter valid zone first.';
    } else if (this._loadingDiskTypes) {
      return `Loading disk types...`;
    } else {
      return '';
    }
  }

  private _reloadDiskTypes(): void {
    if (!this._hasCredentials || !this.nodeData.spec.cloud.gcp.zone) {
      return;
    }

    this._loadingDiskTypes = true;
    iif(() => this.isInWizard(),
        this._wizardService.provider(NodeProvider.GCP)
            .zone(this.nodeData.spec.cloud.gcp.zone)
            .serviceAccount(this.cloudSpec.gcp.serviceAccount)
            .credential(this._selectedPreset)
            .diskTypes(),
        this._apiService.getGCPDiskTypes(
            this.nodeData.spec.cloud.gcp.zone, this.projectId, this.seedDCName, this.clusterId))
        .pipe(first())
        .pipe(takeUntil(this._unsubscribe))
        .subscribe((data) => {
          this._loadingDiskTypes = false;
          this._enableDiskTypes(data);
        }, () => this._disableDiskTypes());
  }

  private _disableSizes(): void {
    this._loadingSizes = false;
    this.machineTypes = [];
    this.form.controls.machineType.setValue('');
    this.form.controls.machineType.disable();
  }

  private _enableSizes(data: GCPMachineSize[]): void {
    this._loadingSizes = false;
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

  getSizeHint(): string {
    if (this.machineTypes.length > 0) {
      return '';
    }

    if (this.isInWizard() && !this._loadingSizes && !this.nodeData.spec.cloud.gcp.zone &&
        !(this.cloudSpec.gcp.serviceAccount || this._selectedPreset)) {
      return 'Please enter valid service account and zone first.';
    } else if (
        this.isInWizard() && !this._loadingSizes && !(this.cloudSpec.gcp.serviceAccount || this._selectedPreset)) {
      return 'Please enter valid service account first.';
    } else if (!this._loadingSizes && !this.nodeData.spec.cloud.gcp.zone) {
      return 'Please enter valid zone first.';
    } else if (this._loadingSizes) {
      return `Loading machine types...`;
    } else {
      return '';
    }
  }

  private _reloadSizes(): void {
    if (!this._hasCredentials || !this.nodeData.spec.cloud.gcp.zone) {
      return;
    }

    this._loadingSizes = true;
    iif(() => this.isInWizard(),
        this._wizardService.provider(NodeProvider.GCP)
            .zone(this.nodeData.spec.cloud.gcp.zone)
            .serviceAccount(this.cloudSpec.gcp.serviceAccount)
            .credential(this._selectedPreset)
            .machineTypes(),
        this._apiService.getGCPSizes(
            this.nodeData.spec.cloud.gcp.zone, this.projectId, this.seedDCName, this.clusterId))
        .pipe(first())
        .pipe(takeUntil(this._unsubscribe))
        .subscribe((data) => {
          this._loadingSizes = false;
          this._enableSizes(data);
        }, () => this._disableSizes());
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
}
