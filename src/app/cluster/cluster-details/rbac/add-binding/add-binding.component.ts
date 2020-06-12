import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {MatButtonToggleChange} from '@angular/material/button-toggle';
import {MatDialogRef} from '@angular/material/dialog';
import {Subject} from 'rxjs';
import {debounceTime, takeUntil} from 'rxjs/operators';

import {NotificationService, RBACService} from '../../../../core/services';
import {ClusterEntity} from '../../../../shared/entity/ClusterEntity';
import {DataCenterEntity} from '../../../../shared/entity/datacenter';
import {ClusterRoleName, CreateBinding, RoleName} from '../../../../shared/entity/rbac';

export enum Controls {
  Email = 'email',
  Group = 'group',
  Role = 'role',
  Namespace = 'namespace',
}

@Component({
  selector: 'km-add-binding',
  templateUrl: './add-binding.component.html',
  styleUrls: ['./add-binding.component.scss'],
})
export class AddBindingComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  @Input() datacenter: DataCenterEntity;
  @Input() projectID: string;
  readonly controls = Controls;
  form: FormGroup;
  bindingType = 'cluster';
  subjectType = 'user';
  clusterRoles: ClusterRoleName[];
  roles: RoleName[];
  private _unsubscribe = new Subject<void>();

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _rbacService: RBACService,
    private readonly _matDialogRef: MatDialogRef<AddBindingComponent>,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Email]: new FormControl('', [Validators.required]),
      [Controls.Group]: new FormControl(''),
      [Controls.Role]: new FormControl('', [Validators.required]),
      [Controls.Namespace]: new FormControl(''),
    });

    this._rbacService
      .getClusterRoleNames(this.cluster.id, this.datacenter.metadata.name, this.projectID)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe((clusterRoles: ClusterRoleName[]) => {
        if (clusterRoles.length > 0) {
          this.clusterRoles = clusterRoles.sort((a, b) => {
            return a.name.localeCompare(b.name);
          });
        } else {
          this.clusterRoles = [];
        }
      });

    this._rbacService
      .getRoleNames(this.cluster.id, this.datacenter.metadata.name, this.projectID)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe((roles: RoleName[]) => {
        if (roles.length > 0) {
          this.roles = roles.sort((a, b) => {
            return a.name.localeCompare(b.name);
          });
        } else {
          this.roles = [];
        }
      });

    this.form.controls.role.valueChanges
      .pipe(debounceTime(1000))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(data => {
        if (this.bindingType === 'namespace') {
          this.checkNamespaceState();
        }
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
    this.checkNamespaceState();
  }

  changeSubjectType(event: MatButtonToggleChange): void {
    this.form.get(Controls.Email).setValue('');
    this.form.get(Controls.Group).setValue('');
    this.subjectType = event.value;
    this.form.get(Controls.Email).clearValidators();
    this.form.get(Controls.Group).clearValidators();
    if (this.subjectType === 'user') {
      this.form.get(Controls.Email).setValidators([Validators.required]);
    } else {
      this.form.get(Controls.Group).setValidators([Validators.required]);
    }
    this.form.get(Controls.Email).updateValueAndValidity();
    this.form.get(Controls.Group).updateValueAndValidity();
  }

  setValidators(): void {
    if (this.bindingType === 'cluster') {
      this.form.get(Controls.Namespace).clearValidators();
    } else {
      this.form.get(Controls.Namespace).setValidators([Validators.required]);
    }
    this.form.get(Controls.Namespace).updateValueAndValidity();
  }

  getRoleFormState(): string {
    let roleLength = 0;
    if (!!this.clusterRoles || !!this.roles) {
      roleLength = this.bindingType === 'cluster' ? this.clusterRoles.length : this.roles.length;
    }

    if (roleLength) {
      return 'Role*';
    } else if (!roleLength) {
      return 'No Roles available';
    }
    return 'Role*';
  }

  getNamespaceFormState(): string {
    const roleLength = this.roles ? this.roles.length : 0;

    if (this.form.get(Controls.Role).value !== '') {
      return 'Namespace*';
    } else if (this.form.get(Controls.Role).value === '' && !!roleLength) {
      return 'Please select a Role first';
    } else if (!roleLength) {
      return 'No Namespaces available';
    }
    return 'Namespace*';
  }

  checkNamespaceState(): void {
    if (this.form.get(Controls.Role).value === '' && this.form.get(Controls.Namespace).enabled) {
      this.form.get(Controls.Namespace).disable();
    } else if (this.form.get(Controls.Role).value !== '' && this.form.get(Controls.Namespace).disabled) {
      this.form.get(Controls.Namespace).enable();
    }
  }

  getNamespaces(): string[] {
    for (const i in this.roles) {
      if (this.roles[i].name === this.form.get(Controls.Role).value) {
        return this.roles[i].namespace;
      }
    }
  }

  addBinding(): void {
    this.bindingType === 'cluster' ? this.addClusterBinding() : this.addNamespaceBinding();
  }

  addClusterBinding(): void {
    const clusterBinding: CreateBinding = {};
    let bindingName;
    if (this.form.controls.email.value) {
      clusterBinding.userEmail = this.form.controls.email.value;
      bindingName = clusterBinding.userEmail;
    }
    if (this.form.controls.group.value) {
      clusterBinding.group = this.form.controls.group.value;
      bindingName = clusterBinding.group;
    }

    this._rbacService
      .createClusterBinding(
        this.cluster.id,
        this.datacenter.metadata.name,
        this.projectID,
        this.form.controls.role.value,
        clusterBinding
      )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(binding => {
        this._matDialogRef.close(binding);
        this._notificationService.success(`The <strong>${bindingName}</strong> binding was added`);
      });
  }

  addNamespaceBinding(): void {
    const namespaceBinding: CreateBinding = {};
    let bindingName;
    if (this.form.controls.email.value) {
      namespaceBinding.userEmail = this.form.controls.email.value;
      bindingName = namespaceBinding.userEmail;
    }
    if (this.form.controls.group.value) {
      namespaceBinding.group = this.form.controls.group.value;
      bindingName = namespaceBinding.group;
    }

    this._rbacService
      .createBinding(
        this.cluster.id,
        this.datacenter.metadata.name,
        this.projectID,
        this.form.controls.role.value,
        this.form.controls.namespace.value,
        namespaceBinding
      )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(binding => {
        this._matDialogRef.close(binding);
        this._notificationService.success(`The <strong>${bindingName}</strong> binding was added`);
      });
  }
}
