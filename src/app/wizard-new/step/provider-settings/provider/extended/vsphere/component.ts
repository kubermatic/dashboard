import {Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR} from '@angular/forms';
import {EMPTY, Observable, onErrorResumeNext} from 'rxjs';
import {catchError, filter, map, switchMap, takeUntil, tap} from 'rxjs/operators';

import {PresetsService} from '../../../../../../core/services';
import {VSphereFolder, VSphereNetwork} from '../../../../../../shared/entity/provider/vsphere/VSphereEntity';
import {NodeProvider} from '../../../../../../shared/model/NodeProviderConstants';
import {isObjectEmpty} from '../../../../../../shared/utils/common-utils';
import {BaseFormValidator} from '../../../../../../shared/validators/base-form.validator';
import {ClusterService} from '../../../../../service/cluster';

enum Controls {
  VMNetName = 'vmNetName',
  Folder = 'folder',
}

@Component({
  selector: 'km-wizard-vsphere-provider-extended',
  templateUrl: './template.html',
  providers: [
    {provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => VSphereProviderExtendedComponent), multi: true},
    {provide: NG_VALIDATORS, useExisting: forwardRef(() => VSphereProviderExtendedComponent), multi: true}
  ]
})
export class VSphereProviderExtendedComponent extends BaseFormValidator implements OnInit, OnDestroy {
  private _networkMap: {[type: string]: VSphereNetwork[]} = {};

  readonly Controls = Controls;

  folders: VSphereFolder[] = [];

  get networkTypes(): string[] {
    return Object.keys(this._networkMap);
  }

  constructor(
      private readonly _builder: FormBuilder, private readonly _presets: PresetsService,
      private readonly _clusterService: ClusterService) {
    super('VSphere Provider Extended');
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.VMNetName]: this._builder.control({value: '', disabled: true}),
      [Controls.Folder]: this._builder.control({value: '', disabled: true}),
    });

    this.form.valueChanges.pipe(takeUntil(this._unsubscribe))
        .subscribe(_ => this._presets.enablePresets(isObjectEmpty(this._clusterService.cluster.spec.cloud.vsphere)));

    this._presets.presetChanges.pipe(takeUntil(this._unsubscribe))
        .subscribe(preset => Object.values(Controls).forEach(control => this._enable(!preset, control)));

    this._clusterService.clusterChanges.pipe(tap(_ => !this._hasRequiredCredentials() ? this._networkMap = {} : null))
        .pipe(filter(_ => this._hasRequiredCredentials() && this.networkTypes.length === 0))
        .pipe(switchMap(_ => this._networkListObservable()))
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(this._loadNetworks.bind(this));

    this._clusterService.clusterChanges.pipe(tap(_ => !this._hasRequiredCredentials() ? this.folders = [] : null))
        .pipe(filter(_ => this._hasRequiredCredentials() && this.folders.length === 0))
        .pipe(switchMap(_ => this._folderListObservable()))
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(folders => this.folders = folders);
  }

  getNetworks(type: string): VSphereNetwork[] {
    return this._networkMap[type];
  }

  onNetworkChange(network: string): void {
    this._clusterService.cluster.spec.cloud.vsphere.vmNetName = network;
  }

  onFolderChange(folder: string): void {
    this._clusterService.cluster.spec.cloud.vsphere.folder = folder;
  }

  getHint(control: Controls): string {
    switch (control) {
      case Controls.VMNetName:
      case Controls.Folder:
        return this._hasRequiredCredentials() ? '' : 'Please enter your credentials first.';
    }
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _loadNetworks(networks: VSphereNetwork[]): void {
    networks.forEach(network => {
      const find = this.networkTypes.find(x => x === network.type);
      if (!find) {
        this._networkMap[network.type] = [];
      }
      this._networkMap[network.type].push(network);
    });
  }

  private _hasRequiredCredentials(): boolean {
    return !!this._clusterService.cluster.spec.cloud.vsphere &&
        !!this._clusterService.cluster.spec.cloud.vsphere.username &&
        !!this._clusterService.cluster.spec.cloud.vsphere.password;
  }

  private _networkListObservable(): Observable<VSphereNetwork[]> {
    return this._presets.provider(NodeProvider.VSPHERE)
        .username(this._clusterService.cluster.spec.cloud.vsphere.username)
        .password(this._clusterService.cluster.spec.cloud.vsphere.password)
        .datacenter(this._clusterService.datacenter)
        .networks()
        .pipe(map(networks => networks.sort((a, b) => a.name.localeCompare(b.name))))
        .pipe(catchError(() => {
          this.form.get(Controls.VMNetName).setValue(undefined);
          return onErrorResumeNext(EMPTY);
        }));
  }

  private _folderListObservable(): Observable<VSphereFolder[]> {
    return this._presets.provider(NodeProvider.VSPHERE)
        .username(this._clusterService.cluster.spec.cloud.vsphere.username)
        .password(this._clusterService.cluster.spec.cloud.vsphere.password)
        .datacenter(this._clusterService.datacenter)
        .folders()
        .pipe(catchError(() => {
          this.form.get(Controls.Folder).setValue(undefined);
          return onErrorResumeNext(EMPTY);
        }));
  }

  private _enable(enable: boolean, name: string): void {
    if (enable && this.form.get(name).disabled) {
      this.form.get(name).enable();
    }

    if (!enable && this.form.get(name).enabled) {
      this.form.get(name).disable();
    }
  }
}
