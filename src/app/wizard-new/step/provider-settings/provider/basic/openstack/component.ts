import {Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {EMPTY, merge, Observable, onErrorResumeNext} from 'rxjs';
import {catchError, distinctUntilChanged, map, switchMap, takeUntil, tap} from 'rxjs/operators';

import {PresetsService} from '../../../../../../core/services';
import {OpenstackCloudSpec} from '../../../../../../shared/entity/cloud/OpenstackCloudSpec';
import {CloudSpec, ClusterEntity, ClusterSpec} from '../../../../../../shared/entity/ClusterEntity';
import {OpenstackFloatingIpPool, OpenstackTenant} from '../../../../../../shared/entity/provider/openstack/OpenstackSizeEntity';
import {NodeProvider} from '../../../../../../shared/model/NodeProviderConstants';
import {BaseFormValidator} from '../../../../../../shared/validators/base-form.validator';
import {ClusterService} from '../../../../../service/cluster';

export enum Controls {
  Domain = 'domain',
  Username = 'username',
  Password = 'password',
  Project = 'project',
  ProjectID = 'projectID',
  FloatingIPPool = 'floatingIPPool',
}

@Component({
  selector: 'km-wizard-openstack-provider-basic',
  templateUrl: './template.html',
  providers: [
    {provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => OpenstackProviderBasicComponent), multi: true},
    {provide: NG_VALIDATORS, useExisting: forwardRef(() => OpenstackProviderBasicComponent), multi: true}
  ]
})
export class OpenstackProviderBasicComponent extends BaseFormValidator implements OnInit, OnDestroy {
  private _domains: string[] = ['Default'];

  readonly Controls = Controls;

  domains = this._domains.map(type => ({name: type}));
  projects: OpenstackTenant[] = [];
  floatingIPPools: OpenstackFloatingIpPool[] = [];

  constructor(
      private readonly _builder: FormBuilder, private readonly _presets: PresetsService,
      private readonly _clusterService: ClusterService) {
    super('Openstack Provider Basic');
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Domain]: this._builder.control('', Validators.required),
      [Controls.Username]: this._builder.control('', Validators.required),
      [Controls.Password]: this._builder.control('', Validators.required),
      [Controls.Project]: this._builder.control('', Validators.required),
      [Controls.ProjectID]: this._builder.control(''),
      [Controls.FloatingIPPool]: this._builder.control('', Validators.required),
    });

    this._presets.presetChanges.pipe(takeUntil(this._unsubscribe))
        .subscribe(preset => Object.values(Controls).forEach(control => this._enable(!preset, control)));

    this.form.valueChanges.pipe(takeUntil(this._unsubscribe))
        .subscribe(
            _ => this._presets.enablePresets(
                Object.values(this._clusterService.cluster.spec.cloud.openstack).every(value => !value)));

    merge(this._clusterService.providerChanges, this._clusterService.datacenterChanges)
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(_ => this.form.reset());

    merge(
        this.form.get(Controls.Domain).valueChanges, this.form.get(Controls.Username).valueChanges,
        this.form.get(Controls.Password).valueChanges, this.form.get(Controls.Project).valueChanges,
        this.form.get(Controls.ProjectID).valueChanges)
        .pipe(distinctUntilChanged())
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(_ => this._clusterService.cluster = this._getClusterEntity());

    merge(
        this.form.get(Controls.Domain).valueChanges, this.form.get(Controls.Username).valueChanges,
        this.form.get(Controls.Password).valueChanges)
        .pipe(distinctUntilChanged())
        .pipe(switchMap(_ => this._projectListObservable()))
        .pipe(takeUntil(this._unsubscribe))
        .subscribe((projects: OpenstackTenant[]) => {
          this.projects = projects;
        });

    merge(this.form.get(Controls.Project).valueChanges, this.form.get(Controls.ProjectID).valueChanges)
        .pipe(tap(_ => !this._hasRequiredCredentials() ? this.floatingIPPools = [] : null))
        .pipe(distinctUntilChanged())
        .pipe(switchMap(_ => this._floatingIPPoolListObservable()))
        .pipe(takeUntil(this._unsubscribe))
        .subscribe((floatingIPPools: OpenstackFloatingIpPool[]) => {
          this.floatingIPPools = floatingIPPools;
        });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  onFloatingIPPoolChange(floatingIPPool: string): void {
    this._clusterService.cluster.spec.cloud.openstack.floatingIpPool = floatingIPPool;
  }

  getHint(control: Controls): string {
    switch (control) {
      case Controls.Project:
        return this._hasRequiredBasicCredentials() ? '' : 'Please enter your credentials first.';
      case Controls.FloatingIPPool:
        return this._hasRequiredCredentials() ? '' : 'Please enter your credentials first.';
    }
  }

  isRequired(control: Controls): boolean {
    switch (control) {
      case Controls.Project:
        return !this.form.get(Controls.ProjectID).value;
      case Controls.ProjectID:
        return !this.form.get(Controls.Project).value;
      default:
        return true;
    }
  }

  private _enable(enable: boolean, name: string): void {
    if (enable && this.form.get(name).disabled) {
      this.form.get(name).enable();
    }

    if (!enable && this.form.get(name).enabled) {
      this.form.get(name).disable();
    }
  }

  private _hasRequiredBasicCredentials(): boolean {
    return !!this._clusterService.cluster.spec.cloud.openstack &&
        !!this._clusterService.cluster.spec.cloud.openstack.domain &&
        !!this._clusterService.cluster.spec.cloud.openstack.username &&
        !!this._clusterService.cluster.spec.cloud.openstack.password;
  }

  private _hasRequiredCredentials(): boolean {
    return !!this._hasRequiredBasicCredentials && !!this._clusterService.cluster.spec.cloud.openstack &&
        (!!this._clusterService.cluster.spec.cloud.openstack.tenant ||
         !!this._clusterService.cluster.spec.cloud.openstack.tenantID);
  }

  private _projectListObservable(): Observable<OpenstackTenant[]> {
    return this._presets.provider(NodeProvider.OPENSTACK)
        .domain(this.form.get(Controls.Domain).value)
        .username(this.form.get(Controls.Username).value)
        .password(this.form.get(Controls.Password).value)
        .datacenter(this._clusterService.cluster.spec.cloud.dc)
        .tenants()
        .pipe(map(projects => projects.sort((a, b) => a.name.localeCompare(b.name))))
        .pipe(catchError(() => {
          this.form.get(Controls.Project).setValue(undefined);
          return onErrorResumeNext(EMPTY);
        }));
  }

  private _floatingIPPoolListObservable(): Observable<OpenstackFloatingIpPool[]> {
    return this._presets.provider(NodeProvider.OPENSTACK)
        .domain(this.form.get(Controls.Domain).value)
        .username(this.form.get(Controls.Username).value)
        .password(this.form.get(Controls.Password).value)
        .tenant(this.form.get(Controls.Project).value)
        .tenantID(this.form.get(Controls.ProjectID).value)
        .datacenter(this._clusterService.cluster.spec.cloud.dc)
        .networks()
        .pipe(map(
            networks =>
                networks.filter((network) => network.external === true).sort((a, b) => a.name.localeCompare(b.name))))
        .pipe(catchError(() => {
          this.form.get(Controls.FloatingIPPool).setValue(undefined);
          return onErrorResumeNext(EMPTY);
        }));
  }

  private _getClusterEntity(): ClusterEntity {
    return {
      spec: {
        cloud: {
          openstack: {
            domain: this.form.get(Controls.Domain).value,
            username: this.form.get(Controls.Username).value,
            password: this.form.get(Controls.Password).value,
            tenant: this.form.get(Controls.Project).value,
            tenantID: this.form.get(Controls.ProjectID).value,
          } as OpenstackCloudSpec
        } as CloudSpec
      } as ClusterSpec
    } as ClusterEntity;
  }
}
