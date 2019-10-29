import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {MatDialogRef} from '@angular/material';
import * as _ from 'lodash';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {ClusterService} from '../../../core/services';
import {ProviderSettingsPatch} from '../../../core/services/cluster/cluster.service';
import {NotificationActions} from '../../../redux/actions/notification.actions';
import {ClusterEntity} from '../../../shared/entity/ClusterEntity';
import {ClusterEntityPatch} from '../../../shared/entity/ClusterEntityPatch';
import {DataCenterEntity} from '../../../shared/entity/DatacenterEntity';
import {ResourceType} from '../../../shared/entity/LabelsEntity';
import {AsyncValidators} from '../../../shared/validators/async-label-form.validator';

@Component({
  selector: 'kubermatic-edit-cluster',
  templateUrl: './edit-cluster.component.html',
  styleUrls: ['./edit-cluster.component.scss'],
})
export class EditClusterComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  @Input() datacenter: DataCenterEntity;
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
      private readonly _matDialogRef: MatDialogRef<EditClusterComponent>) {}

  ngOnInit(): void {
    this.labels = _.cloneDeep(this.cluster.labels);

    this.form = new FormGroup({
      name: new FormControl(
          this.cluster.name,
          [
            Validators.required,
            Validators.minLength(3),
            Validators.pattern('[a-zA-Z0-9-]*'),
          ]),
      auditLogging: new FormControl(!!this.cluster.spec.auditLogging && this.cluster.spec.auditLogging.enabled),
      labels: new FormControl(''),
    });

    this._clusterService.providerSettingsPatchChanges$.pipe(takeUntil(this._unsubscribe))
        .subscribe(async patch => this.providerSettingsPatch = await patch);
  }

  editCluster(): void {
    const patch: ClusterEntityPatch = {
      name: this.form.controls.name.value,
      labels: this.labels,
      spec: {
        cloud: this.providerSettingsPatch.cloudSpecPatch,
        auditLogging: {
          enabled: this.form.controls.auditLogging.value,
        }
      },
    };

    this._clusterService.patch(this.projectID, this.cluster.id, this.datacenter.metadata.name, patch)
        .subscribe((cluster) => {
          this._matDialogRef.close(cluster);
          this._clusterService.onClusterUpdate.next();
          NotificationActions.success(`Cluster ${this.cluster.name} has been successfully edited`);
        });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }
}
