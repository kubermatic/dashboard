import {Component, Input, OnDestroy, OnInit, SimpleChanges} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {iif, Subject} from 'rxjs';
import {debounceTime, distinctUntilChanged, first, startWith, takeUntil} from 'rxjs/operators';

import {ApiService, WizardService} from '../../core/services';
import {NodeDataService} from '../../core/services/node-data/node-data.service';
import {CloudSpec} from '../../shared/entity/cluster';
import {GCPDiskType, GCPMachineSize, GCPZone} from '../../shared/entity/provider/gcp/GCP';
import {NodeProvider} from '../../shared/model/NodeProviderConstants';
import {NodeData, NodeProviderData} from '../../shared/model/NodeSpecChange';
import {filterArrayOptions} from '../../shared/utils/common-utils';
import {AutocompleteFilterValidators} from '../../shared/validators/autocomplete-filter.validator';

@Component({
  selector: 'km-gcp-node-data',
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
  filteredMachineTypes: GCPMachineSize[] = [];

  private _loadingZones = false;
  private _loadingDiskTypes = false;
  private _loadingSizes = false;
  private _selectedPreset: string;
  private _unsubscribe: Subject<any> = new Subject();

  constructor(
    private readonly _nodeDataService: NodeDataService,
    private readonly _wizardService: WizardService,
    private readonly _apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.form = new FormGroup({
      diskSize: new FormControl(this.nodeData.spec.cloud.gcp.diskSize, Validators.required),
      diskType: new FormControl({value: this.nodeData.spec.cloud.gcp.diskType, disabled: true}, Validators.required),
      machineType: new FormControl({value: this.nodeData.spec.cloud.gcp.machineType, disabled: true}, [
        Validators.required,
        AutocompleteFilterValidators.mustBeInArrayList(this.machineTypes, 'name', true),
      ]),
      zone: new FormControl({value: this.nodeData.spec.cloud.gcp.zone, disabled: true}, Validators.required),
      customImage: new FormControl(this.nodeData.spec.cloud.gcp.customImage),
      preemptible: new FormControl(this.nodeData.spec.cloud.gcp.preemptible),
    });

    this.form.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
      this._nodeDataService.changeNodeProviderData(this.getNodeProviderData());
    });

    this._nodeDataService.changeNodeProviderData(this.getNodeProviderData());

    this._wizardService.clusterProviderSettingsFormChanges$.pipe(takeUntil(this._unsubscribe)).subscribe(data => {
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

    this.form.controls.zone.valueChanges
      .pipe(debounceTime(1000), distinctUntilChanged(), takeUntil(this._unsubscribe))
      .subscribe(value => {
        this.nodeData.spec.cloud.gcp.zone = value;
        this._reloadSizes();
        this._reloadDiskTypes();
      });

    this.form.controls.machineType.valueChanges
      .pipe(debounceTime(1000), startWith(''), takeUntil(this._unsubscribe))
      .subscribe(value => {
        if (value !== '' && !this.form.controls.machineType.pristine) {
          this.filteredMachineTypes = filterArrayOptions(value, 'name', this.machineTypes);
        } else {
          this.filteredMachineTypes = this.machineTypes;
        }
        this.form.controls.machineType.setValidators([
          Validators.required,
          AutocompleteFilterValidators.mustBeInArrayList(this.machineTypes, 'name', true),
        ]);
      });

    this._reloadZones();
    this._reloadSizes();
    this._reloadDiskTypes();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.cloudSpec && !changes.cloudSpec.firstChange) {
      if (
        !changes.cloudSpec.previousValue ||
        changes.cloudSpec.currentValue.gcp.serviceAccount !== changes.cloudSpec.previousValue.gcp.serviceAccount
      ) {
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
      if (
        this.nodeData.spec.cloud.gcp.zone !== '' &&
        this.zones.filter(value => value.name === this.nodeData.spec.cloud.gcp.zone).length > 0
      ) {
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
      return 'Loading zones...';
    }
    return '';
  }

  private _reloadZones(): void {
    if (!this._hasCredentials) {
      return;
    }

    this._loadingZones = true;
    iif(
      () => this.isInWizard(),
      this._wizardService
        .provider(NodeProvider.GCP)
        .serviceAccount(this.cloudSpec.gcp.serviceAccount)
        .credential(this._selectedPreset)
        .zones(this.cloudSpec.dc),
      this._apiService.getGCPZones(this.projectId, this.seedDCName, this.clusterId)
    )
      .pipe(first())
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(
        data => {
          this._loadingZones = false;
          this._enableZones(data);
        },
        () => this._disableZones()
      );
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
      if (
        this.nodeData.spec.cloud.gcp.diskType !== '' &&
        this.diskTypes.filter(value => value.name === this.nodeData.spec.cloud.gcp.diskType).length > 0
      ) {
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

    if (
      this.isInWizard() &&
      !this._loadingDiskTypes &&
      !this.nodeData.spec.cloud.gcp.zone &&
      !(this.cloudSpec.gcp.serviceAccount || this._selectedPreset)
    ) {
      return 'Please enter valid service account and zone first.';
    } else if (
      this.isInWizard() &&
      !this._loadingDiskTypes &&
      !(this.cloudSpec.gcp.serviceAccount || this._selectedPreset)
    ) {
      return 'Please enter valid service account first.';
    } else if (!this._loadingDiskTypes && !this.nodeData.spec.cloud.gcp.zone) {
      return 'Please enter valid zone first.';
    } else if (this._loadingDiskTypes) {
      return 'Loading disk types...';
    }
    return '';
  }

  private _reloadDiskTypes(): void {
    if (!this._hasCredentials || !this.nodeData.spec.cloud.gcp.zone) {
      return;
    }

    this._loadingDiskTypes = true;
    iif(
      () => this.isInWizard(),
      this._wizardService
        .provider(NodeProvider.GCP)
        .zone(this.nodeData.spec.cloud.gcp.zone)
        .serviceAccount(this.cloudSpec.gcp.serviceAccount)
        .credential(this._selectedPreset)
        .diskTypes(),
      this._apiService.getGCPDiskTypes(
        this.nodeData.spec.cloud.gcp.zone,
        this.projectId,
        this.seedDCName,
        this.clusterId
      )
    )
      .pipe(first())
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(
        data => {
          this._loadingDiskTypes = false;
          this._enableDiskTypes(data);
        },
        () => this._disableDiskTypes()
      );
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
      if (
        this.nodeData.spec.cloud.gcp.machineType !== '' &&
        this.machineTypes.filter(value => value.name === this.nodeData.spec.cloud.gcp.machineType).length > 0
      ) {
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

    if (
      this.isInWizard() &&
      !this._loadingSizes &&
      !this.nodeData.spec.cloud.gcp.zone &&
      !(this.cloudSpec.gcp.serviceAccount || this._selectedPreset)
    ) {
      return 'Please enter valid service account and zone first.';
    } else if (
      this.isInWizard() &&
      !this._loadingSizes &&
      !(this.cloudSpec.gcp.serviceAccount || this._selectedPreset)
    ) {
      return 'Please enter valid service account first.';
    } else if (!this._loadingSizes && !this.nodeData.spec.cloud.gcp.zone) {
      return 'Please enter valid zone first.';
    } else if (this._loadingSizes) {
      return 'Loading machine types...';
    }
    return '';
  }

  private _reloadSizes(): void {
    if (!this._hasCredentials || !this.nodeData.spec.cloud.gcp.zone) {
      return;
    }

    this._loadingSizes = true;
    iif(
      () => this.isInWizard(),
      this._wizardService
        .provider(NodeProvider.GCP)
        .zone(this.nodeData.spec.cloud.gcp.zone)
        .serviceAccount(this.cloudSpec.gcp.serviceAccount)
        .credential(this._selectedPreset)
        .machineTypes(),
      this._apiService.getGCPSizes(this.nodeData.spec.cloud.gcp.zone, this.projectId, this.seedDCName, this.clusterId)
    )
      .pipe(first())
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(
        data => {
          this._loadingSizes = false;
          this._enableSizes(data);
        },
        () => this._disableSizes()
      );
  }

  getNodeProviderData(): NodeProviderData {
    return {
      spec: {
        gcp: {
          diskSize: this.form.controls.diskSize.value,
          diskType: this.form.controls.diskType.value,
          machineType: this.form.controls.machineType.value,
          preemptible: this.form.controls.preemptible.value,
          zone: this.form.controls.zone.value,
          labels: this.nodeData.spec.cloud.gcp.labels,
          tags: this.nodeData.spec.cloud.gcp.tags,
          customImage: this.form.controls.customImage.value,
        },
      },
      valid: this.form.valid,
    };
  }
}
