import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {MatDialogRef} from '@angular/material/dialog';
import * as _ from 'lodash';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {ClusterService, NotificationService} from '../../../core/services';
import {ProviderSettingsPatch} from '../../../core/services/cluster/cluster.service';
import {Cluster, ClusterEntityPatch} from '../../../shared/entity/cluster';
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
  providerSettingsPatch: ProviderSettingsPatch = {
    isValid: true,
    cloudSpecPatch: {},
  };

  private _unsubscribe = new Subject<void>();
  asyncLabelValidators = [AsyncValidators.RestrictedLabelKeyName(ResourceType.Cluster)];

  constructor(
    private readonly _clusterService: ClusterService,
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
      usePodSecurityPolicyAdmissionPlugin: new FormControl(this.cluster.spec.usePodSecurityPolicyAdmissionPlugin),
      usePodNodeSelectorAdmissionPlugin: new FormControl(this.cluster.spec.usePodNodeSelectorAdmissionPlugin),
      labels: new FormControl(''),
    });

    this._clusterService.providerSettingsPatchChanges$
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(async patch => (this.providerSettingsPatch = await patch));

    this.checkEnforcedFieldsState();
  }

  checkEnforcedFieldsState(): void {
    if (this.datacenter.spec.enforceAuditLogging) {
      this.form.controls.auditLogging.setValue(true);
      this.form.controls.auditLogging.disable();
    }

    if (this.datacenter.spec.enforcePodSecurityPolicy) {
      this.form.controls.usePodSecurityPolicyAdmissionPlugin.setValue(true);
      this.form.controls.usePodSecurityPolicyAdmissionPlugin.disable();
    }
  }

  editCluster(): void {
    const patch: ClusterEntityPatch = {
      name: this.form.controls.name.value,
      labels: this.labels,
      spec: {
        cloud: this.providerSettingsPatch.cloudSpecPatch,
        auditLogging: {
          enabled: this.form.controls.auditLogging.value,
        },
        usePodSecurityPolicyAdmissionPlugin: this.form.controls.usePodSecurityPolicyAdmissionPlugin.value,
        usePodNodeSelectorAdmissionPlugin: this.form.controls.usePodNodeSelectorAdmissionPlugin.value,
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
