import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {AbstractControl, FormControl, FormGroup, Validators} from '@angular/forms';
import {MatButtonToggleChange, MatDialogRef} from '@angular/material';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {RBACService} from '../../../../core/services';
import {NotificationActions} from '../../../../redux/actions/notification.actions';
import {ClusterEntity} from '../../../../shared/entity/ClusterEntity';
import {DataCenterEntity} from '../../../../shared/entity/DatacenterEntity';
import {ClusterRole, CreateBinding, CreateClusterBinding, Namespace, Role} from '../../../../shared/entity/RBACEntity';

@Component({
  selector: 'kubermatic-add-binding',
  templateUrl: './add-binding.component.html',
  styleUrls: ['./add-binding.component.scss'],
})

export class AddBindingComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  @Input() datacenter: DataCenterEntity;
  @Input() projectID: string;
  form: FormGroup;
  bindingType = 'cluster';
  clusterRoles: ClusterRole[];
  roles: Role[];
  namespaces: Namespace[];
  private _unsubscribe = new Subject<void>();

  constructor(
      private readonly _rbacService: RBACService, private readonly _matDialogRef: MatDialogRef<AddBindingComponent>) {}

  ngOnInit(): void {
    this.form = new FormGroup({
      email: new FormControl('', [Validators.required]),
      role: new FormControl('', [Validators.required]),
      namespace: new FormControl(''),
    });

    this._rbacService.getClusterRoles(this.cluster.id, this.datacenter.metadata.name, this.projectID)
        .pipe(takeUntil(this._unsubscribe))
        .subscribe((clusterRoles: ClusterRole[]) => {
          this.clusterRoles = clusterRoles;
        });

    this._rbacService.getRoles(this.cluster.id, this.datacenter.metadata.name, this.projectID)
        .pipe(takeUntil(this._unsubscribe))
        .subscribe((roles: Role[]) => {
          this.roles = roles;
        });

    this._rbacService.getNamespaces(this.cluster.id, this.datacenter.metadata.name, this.projectID)
        .pipe(takeUntil(this._unsubscribe))
        .subscribe((namespaces: Namespace[]) => {
          this.namespaces = namespaces;
        });

    this.setValidators();
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  changeView(event: MatButtonToggleChange): void {
    this.bindingType = event.value;
    this.setValidators();
  }

  get namespace(): AbstractControl {
    return this.form.controls.namespace;
  }

  setValidators(): void {
    if (this.bindingType === 'cluster') {
      this.namespace.clearValidators();
    } else {
      this.namespace.setValidators([Validators.required]);
    }
    this.namespace.updateValueAndValidity();
  }

  addBinding(): void {
    this.bindingType === 'cluster' ? this.addClusterBinding() : this.addNamespaceBinding();
  }

  addClusterBinding(): void {
    const clusterBinding: CreateClusterBinding = {
      email: this.form.controls.email.value,
      role: this.form.controls.role.value,
    };

    this._rbacService
        .createClusterBinding(
            this.cluster.id, this.datacenter.metadata.name, this.projectID, clusterBinding.role, clusterBinding)
        .pipe(takeUntil(this._unsubscribe))
        .subscribe((binding) => {
          this._matDialogRef.close(binding);
          NotificationActions.success(`${clusterBinding.email} has been added successfully`);
        });
  }

  addNamespaceBinding(): void {
    const namespaceBinding: CreateBinding = {
      email: this.form.controls.email.value,
      role: this.form.controls.role.value,
      namespace: this.form.controls.namespace.value,
    };

    this._rbacService
        .createBinding(
            this.cluster.id, this.datacenter.metadata.name, this.projectID, namespaceBinding.role,
            namespaceBinding.namespace, namespaceBinding)
        .pipe(takeUntil(this._unsubscribe))
        .subscribe((binding) => {
          this._matDialogRef.close(binding);
          NotificationActions.success(`${namespaceBinding.email} has been added successfully`);
        });
  }
}
