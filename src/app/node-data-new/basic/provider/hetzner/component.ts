import {ChangeDetectionStrategy, ChangeDetectorRef, Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {Observable} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {HetznerTypes, Type} from '../../../../shared/entity/provider/hetzner/TypeEntity';
import {BaseFormValidator} from '../../../../shared/validators/base-form.validator';
import {NodeDataService} from '../../../service/service';

enum Controls {
  Type = 'type',
}

enum GroupTypes {
  Dedicated = 'Dedicated vCPU Instances',
  Standard = 'Standard Instances',
}

enum TypeState {
  Ready = 'Node Type',
  Loading = 'Loading...',
  Empty = 'No Node Types Available',
}

@Component({
  selector: 'km-hetzner-basic-node-data',
  templateUrl: './template.html',
  providers: [
    {provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => HetznerBasicNodeDataComponent), multi: true},
    {provide: NG_VALIDATORS, useExisting: forwardRef(() => HetznerBasicNodeDataComponent), multi: true}
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HetznerBasicNodeDataComponent extends BaseFormValidator implements OnInit, OnDestroy {
  private _types: HetznerTypes = HetznerTypes.newHetznerTypes();

  readonly Controls = Controls;

  selectedType = '';
  typeLabel = TypeState.Empty;

  get groups(): string[] {
    return Object.values(GroupTypes);
  }

  constructor(
      private readonly _builder: FormBuilder, private readonly _nodeDataService: NodeDataService,
      private readonly _cdr: ChangeDetectorRef) {
    super();
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Type]: this._builder.control('', Validators.required),
    });

    this._typesObservable.pipe(takeUntil(this._unsubscribe)).subscribe(this._setDefaultType.bind(this));
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getTypes(group: GroupTypes): Type[] {
    const key = Object.keys(GroupTypes).find(key => GroupTypes[key] === group);
    return this._types[key.toLowerCase()];
  }

  onTypeChange(type: string): void {
    this._nodeDataService.nodeData.spec.cloud = {hetzner: {type}};
  }

  typeDisplayName(name: string): string {
    const type = [...this._types.dedicated, ...this._types.standard].find(type => type.name === name);
    return type ? `${type.name} (${type.cores} vCPU, ${type.memory} GB RAM)` : '';
  }

  private get _typesObservable(): Observable<HetznerTypes> {
    return this._nodeDataService.hetzner.flavors(this._clearType.bind(this), this._onTypeLoading.bind(this));
  }

  private _onTypeLoading(): void {
    this._clearType();
    this.typeLabel = TypeState.Loading;
    this._cdr.detectChanges();
  }

  private _clearType(): void {
    this.selectedType = '';
    this._types = HetznerTypes.newHetznerTypes();
    this.typeLabel = TypeState.Empty;
    this._cdr.detectChanges();
  }

  private _setDefaultType(types: HetznerTypes): void {
    this._types = types;
    if (this._types && this._types.standard && this._types.standard.length > 0) {
      this.selectedType = this._types.standard[0].name;
      this.typeLabel = TypeState.Ready;
      this._cdr.detectChanges();
    }
  }
}
