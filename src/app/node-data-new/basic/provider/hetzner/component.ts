import {Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {Observable, of} from 'rxjs';
import {catchError, takeUntil} from 'rxjs/operators';
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

@Component({
  selector: 'kubermatic-hetzner-basic-node-data',
  templateUrl: './template.html',
  providers: [
    {provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => HetznerBasicNodeDataComponent), multi: true},
    {provide: NG_VALIDATORS, useExisting: forwardRef(() => HetznerBasicNodeDataComponent), multi: true}
  ]
})
export class HetznerBasicNodeDataComponent extends BaseFormValidator implements OnInit, OnDestroy {
  types: HetznerTypes = {dedicated: [], standard: []};
  selectedType = '';

  readonly Controls = Controls;

  get groups(): string[] {
    return Object.values(GroupTypes);
  }

  constructor(private readonly _builder: FormBuilder, private readonly _nodeDataService: NodeDataService) {
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
    return this.types[key.toLowerCase()];
  }

  onTypeChange(type: string): void {
    this._nodeDataService.nodeData.spec.cloud = {hetzner: {type}};
  }

  private get _typesObservable(): Observable<HetznerTypes> {
    return this._nodeDataService.hetzner.flavors().pipe(catchError(() => of<HetznerTypes>()));
  }

  private _setDefaultType(types: HetznerTypes): void {
    this.types = types;
    if (this.types && this.types.standard && this.types.standard.length > 0) {
      this.selectedType = this.types.standard[0].name;
    }
  }
}
