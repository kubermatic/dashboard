import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {MatDialogRef} from '@angular/material/dialog';
import * as _ from 'lodash';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {ApiService, ClusterService, NotificationService} from '../../../core/services';
import {ProviderSettingsPatch} from '../../../core/services/cluster/cluster.service';
import {Cluster, ClusterPatch} from '../../../shared/entity/cluster';
import {Datacenter} from '../../../shared/entity/datacenter';
import {AsyncValidators} from '../../../shared/validators/async-label-form.validator';
import {ResourceType} from '../../../shared/entity/common';

@Component({
  selector: 'km-edit-cluster',
  templateUrl: './edit-cluster.component.html',
  styleUrls: ['./edit-cluster.component.scss'],
})
export class EditClusterComponent implements OnInit, OnDestroy {
  @Input() cluster: Cluster;
  @Input() datacenter: Datacenter;
  @Input() projectID: string;
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

    this._apiService
      .getAdmissionPlugins(this.cluster.spec.version)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(plugins => (this.admissionPlugins = plugins));

    this.checkForLegacyAdmissionPlugins();
  }

  checkForLegacyAdmissionPlugins(): void {
    if (this.cluster.spec.usePodNodeSelectorAdmissionPlugin) {
      const value = this.updateSelectedPluginArray('PodNodeSelector');
      this.form.controls.admissionPlugins.setValue(value);
    }

    if (this.cluster.spec.usePodSecurityPolicyAdmissionPlugin) {
      const value = this.updateSelectedPluginArray('PodSecurityPolicy');
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
      const value = this.updateSelectedPluginArray('PodSecurityPolicy');
      this.form.controls.admissionPlugins.setValue(value);
    }
  }

  updateSelectedPluginArray(name: string): string[] {
    const plugins: string[] = this.form.controls.admissionPlugins.value
      ? this.form.controls.admissionPlugins.value
      : [];
    if (!plugins.some(x => x === name)) {
      plugins.push(name);
    }
    return plugins;
  }

  getPluginName(name: string): string {
    return name.replace(/([A-Z])/g, ' $1').trim();
  }

  isPluginEnabled(name: string): boolean {
    return (
      !!this.form.controls.admissionPlugins.value && this.form.controls.admissionPlugins.value.some(x => x === name)
    );
  }

  isPodSecurityPolicyEnforced(): boolean {
    return !!this.datacenter && !!this.datacenter.spec && !!this.datacenter.spec.enforcePodSecurityPolicy;
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

    this._clusterService
      .patch(this.projectID, this.cluster.id, this.datacenter.metadata.name, patch)
      .subscribe(cluster => {
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
