import {Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {Observable, of} from 'rxjs';
import {catchError, debounceTime, startWith, takeUntil} from 'rxjs/operators';

import {NodeCloudSpec, NodeSpec} from '../../../../shared/entity/NodeEntity';
import {HetznerTypes} from '../../../../shared/entity/provider/hetzner/TypeEntity';
import {NodeData} from '../../../../shared/model/NodeSpecChange';
import {filterObjectOptions} from '../../../../shared/utils/common-utils';
import {AutocompleteFilterValidators} from '../../../../shared/validators/autocomplete-filter.validator';
import {BaseFormValidator} from '../../../../shared/validators/base-form.validator';
import {NodeDataService} from '../../../service/service';

enum Controls {
  Type = 'type',
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
  filteredTypes: HetznerTypes = {dedicated: [], standard: []};
  hideOptional = false;

  readonly Controls = Controls;

  private readonly _debounceTime = 250;

  constructor(private readonly _builder: FormBuilder, private readonly _nodeDataService: NodeDataService) {
    super();
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Type]: this._builder.control('', Validators.required),
    });

    this._nodeDataService.nodeData = this._getNodeData();

    this._typesObservable.pipe(takeUntil(this._unsubscribe)).subscribe(this._setDefaultType.bind(this));

    this.form.get(Controls.Type)
        .valueChanges.pipe(debounceTime(this._debounceTime), takeUntil(this._unsubscribe), startWith(''))
        .subscribe(value => {
          if (value !== '' && !this.form.controls.type.pristine) {
            this.filteredTypes = filterObjectOptions(value, 'name', this.types);
          } else {
            this.filteredTypes = this.types;
          }
          this.form.controls.type.setValidators(
              [AutocompleteFilterValidators.mustBeInObjectList(this.types, 'name', true)]);
          this.form.controls.type.updateValueAndValidity();
        });

    this.form.valueChanges.pipe(takeUntil(this._unsubscribe))
        .subscribe(_ => this._nodeDataService.nodeData = this._getNodeData());
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  hasError(control: string, errorName: string): boolean {
    return this.form.get(control).hasError(errorName);
  }

  isInWizard(): boolean {
    return this._nodeDataService.isInWizardMode();
  }

  private get _typesObservable(): Observable<HetznerTypes> {
    return this._nodeDataService.hetzner.flavors().pipe(catchError(() => of<HetznerTypes>()));
  }

  private _setDefaultType(types: HetznerTypes): void {
    this.types = types;
    if (this.types && this.types.standard && this.types.standard.length > 0) {
      this.form.get(Controls.Type).setValue(this.types.standard[0].name);
    }
  }

  private _getNodeData(): NodeData {
    return {
      spec: {
        cloud: {
          hetzner: {
            type: this.form.get(Controls.Type).value,
          },
        } as NodeCloudSpec,
      } as NodeSpec,
    } as NodeData;
  }
}
