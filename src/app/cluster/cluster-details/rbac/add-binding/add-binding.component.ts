import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {AbstractControl, FormControl, FormGroup, Validators} from '@angular/forms';
import {MatButtonToggleChange, MatDialogRef} from '@angular/material';
import {Subject} from 'rxjs';
import {debounceTime, takeUntil} from 'rxjs/operators';

import {RBACService} from '../../../../core/services';
import {NotificationActions} from '../../../../redux/actions/notification.actions';
import {ClusterEntity} from '../../../../shared/entity/ClusterEntity';
import {DataCenterEntity} from '../../../../shared/entity/DatacenterEntity';
import {ClusterRoleName, CreateBinding, CreateClusterBinding, RoleName} from '../../../../shared/entity/RBACEntity';

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
  clusterRoles: ClusterRoleName[];
  roles: RoleName[];
  private _unsubscribe = new Subject<void>();

  constructor(
      private readonly _rbacService: RBACService, private readonly _matDialogRef: MatDialogRef<AddBindingComponent>) {}

  ngOnInit(): void {
    this.form = new FormGroup({
      email: new FormControl('', [Validators.required]),
      role: new FormControl('', [Validators.required]),
      namespace: new FormControl(''),
    });

    this._rbacService.getClusterRoleNames(this.cluster.id, this.datacenter.metadata.name, this.projectID)
        .pipe(takeUntil(this._unsubscribe))
        .subscribe((clusterRoles: ClusterRoleName[]) => {
          this.clusterRoles = clusterRoles.sort((a, b) => {
            return a.name.localeCompare(b.name);
          });
        });

    this._rbacService.getRoleNames(this.cluster.id, this.datacenter.metadata.name, this.projectID)
        .pipe(takeUntil(this._unsubscribe))
        .subscribe((roles: RoleName[]) => {
          this.roles = roles.sort((a, b) => {
            return a.name.localeCompare(b.name);
          });
        });

    this.form.controls.role.valueChanges.pipe(debounceTime(1000))
        .pipe(takeUntil(this._unsubscribe))
        .subscribe((data) => {
          this.checkNamespaceState();
        });

    this.setValidators();
    this.checkNamespaceState();
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  changeView(event: MatButtonToggleChange): void {
    this.bindingType = event.value;
    this.setValidators();
  }

  get role(): AbstractControl {
    return this.form.controls.role;
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

  getRoleFormState(): string {
    let roleLength = 0;
    if (!!this.clusterRoles || !!this.roles) {
      roleLength = this.bindingType === 'cluster' ? this.clusterRoles.length : this.roles.length;
    }

    if (!!roleLength) {
      return 'Role*';
    } else if (!roleLength) {
      return 'No Roles available';
    } else {
      return 'Role*';
    }
  }

  getNamespaceFormState(): string {
    let roleLength = 0;
    if (!!this.clusterRoles || !!this.roles) {
      roleLength = this.bindingType === 'cluster' ? this.clusterRoles.length : this.roles.length;
    }

    if (this.role.value !== '') {
      return 'Namespace*';
    } else if (this.role.value === '' && !!roleLength) {
      return 'Please select a Role first';
    } else if (!roleLength) {
      return 'No Namespaces available';
    } else {
      return 'Namespace*';
    }
  }

  checkNamespaceState(): void {
    if (this.role.value === '' && this.namespace.enabled) {
      this.namespace.disable();
    } else if (this.role.value !== '' && this.namespace.disabled) {
      this.namespace.enable();
    }
  }

  getNamespaces(): string[] {
    for (const i in this.roles) {
      if (this.roles[i].name === this.role.value) {
        return this.roles[i].namespace;
      }
    }
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
