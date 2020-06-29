import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {MatDialogRef} from '@angular/material/dialog';
import * as _ from 'lodash';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {ApiService, ClusterService, DatacenterService, NotificationService} from '../../../core/services';
import {ProviderSettingsPatch} from '../../../core/services/cluster/cluster.service';
import {Cluster, ClusterPatch} from '../../../shared/entity/cluster';
import {AsyncValidators} from '../../../shared/validators/async-label-form.validator';
import {ResourceType} from '../../../shared/entity/common';
import {
  AdmissionPlugin,
  AdmissionPluginUtils,
} from '../../../shared/utils/admission-plugin-utils/admission-plugin-utils';
import {Datacenter} from '../../../shared/entity/datacenter';
@Component({
  selector: 'km-edit-cluster',
  templateUrl: './edit-cluster.component.html',
  styleUrls: ['./edit-cluster.component.scss'],
})
export class EditClusterComponent implements OnInit, OnDestroy {
  @Input() cluster: Cluster;
  @Input() seed: string;
  @Input() projectID: string;
  datacenter: Datacenter;
  admissionPlugin = AdmissionPlugin;
  form: FormGroup;
  labels: object;
  admissionPlugins: string[] = [];
  providerSettingsPatch: ProviderSettingsPatch = {
    isValid: true,
    cloudSpecPatch: {},
  };

  private _unsubscribe = new Subject<void>();
  asyncLabelValidators = [AsyncValidators.RestrictedLabelKeyName(ResourceType.Cluster)];

  constructor(
    private readonly _clusterService: ClusterService,
    private readonly _apiService: ApiService,
    private readonly _datacenterService: DatacenterService,
    private readonly _matDialogRef: MatDialogRef<EditClusterComponent>,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.labels = _.cloneDeep(this.cluster.labels);

    this.form = new FormGroup({
      name: new FormControl(this.cluster.name, [
        Validators.required,
        Validators.minLength(3),
        Validators.pattern('[a-zA-Z0-9-]*'),
      ]),
      auditLogging: new FormControl(!!this.cluster.spec.auditLogging && this.cluster.spec.auditLogging.enabled),
      admissionPlugins: new FormControl(this.cluster.spec.admissionPlugins),
      labels: new FormControl(''),
    });

    this._clusterService.providerSettingsPatchChanges$
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(async patch => (this.providerSettingsPatch = await patch));

    this._datacenterService
      .getDatacenter(this.cluster.spec.cloud.dc)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(datacenter => (this.datacenter = datacenter));

    this._apiService
      .getAdmissionPlugins(this.cluster.spec.version)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(plugins => (this.admissionPlugins = plugins));

    this.checkForLegacyAdmissionPlugins();
  }

  checkForLegacyAdmissionPlugins(): void {
    if (this.cluster.spec.usePodNodeSelectorAdmissionPlugin) {
      const value = AdmissionPluginUtils.updateSelectedPluginArray(
        this.form.controls.admissionPlugins,
        AdmissionPlugin.PodNodeSelector
      );
      this.form.controls.admissionPlugins.setValue(value);
    }

    if (this.cluster.spec.usePodSecurityPolicyAdmissionPlugin) {
      const value = AdmissionPluginUtils.updateSelectedPluginArray(
        this.form.controls.admissionPlugins,
        AdmissionPlugin.PodSecurityPolicy
      );
      this.form.controls.admissionPlugins.setValue(value);
    }

    this.checkEnforcedFieldsState();
  }

  checkEnforcedFieldsState(): void {
    if (this.datacenter.spec.enforceAuditLogging) {
      this.form.controls.auditLogging.setValue(true);
      this.form.controls.auditLogging.disable();
    }

    if (this.datacenter.spec.enforcePodSecurityPolicy) {
      const value = AdmissionPluginUtils.updateSelectedPluginArray(
        this.form.controls.admissionPlugins,
        AdmissionPlugin.PodSecurityPolicy
      );
      this.form.controls.admissionPlugins.setValue(value);
    }
  }

  getPluginName(name: string): string {
    return AdmissionPluginUtils.getPluginName(name);
  }

  isPluginEnabled(name: string): boolean {
    return AdmissionPluginUtils.isPluginEnabled(this.form.controls.admissionPlugins, name);
  }

  isPodSecurityPolicyEnforced(): boolean {
    return AdmissionPluginUtils.isPodSecurityPolicyEnforced(this.datacenter);
  }

  editCluster(): void {
    const patch: ClusterPatch = {
      name: this.form.controls.name.value,
      labels: this.labels,
      spec: {
        cloud: this.providerSettingsPatch.cloudSpecPatch,
        auditLogging: {
          enabled: this.form.controls.auditLogging.value,
        },
        usePodNodeSelectorAdmissionPlugin: null,
        usePodSecurityPolicyAdmissionPlugin: null,
        admissionPlugins: this.form.controls.admissionPlugins.value,
      },
    };

    this._clusterService.patch(this.projectID, this.cluster.id, this.seed, patch).subscribe(cluster => {
      this._matDialogRef.close(cluster);
      this._clusterService.onClusterUpdate.next();
      this._notificationService.success(`The <strong>${this.cluster.name}</strong> cluster was updated`);
    });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }
}
