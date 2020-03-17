import {Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {Observable, of} from 'rxjs';
import {catchError, debounceTime, startWith, takeUntil} from 'rxjs/operators';

import {NodeCloudSpec, NodeSpec} from '../../../../shared/entity/NodeEntity';
import {DigitaloceanSizes} from '../../../../shared/entity/provider/digitalocean/DropletSizeEntity';
import {NodeData} from '../../../../shared/model/NodeSpecChange';
import {filterObjectOptions} from '../../../../shared/utils/common-utils';
import {AutocompleteFilterValidators} from '../../../../shared/validators/autocomplete-filter.validator';
import {BaseFormValidator} from '../../../../shared/validators/base-form.validator';
import {NodeDataService} from '../../../service/service';

enum Controls {
  Size = 'size',
}

@Component({
  selector: 'kubermatic-digitalocean-basic-node-data',
  templateUrl: './template.html',
  providers: [
    {provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DigitalOceanBasicNodeDataComponent), multi: true},
    {provide: NG_VALIDATORS, useExisting: forwardRef(() => DigitalOceanBasicNodeDataComponent), multi: true}
  ]
})
export class DigitalOceanBasicNodeDataComponent extends BaseFormValidator implements OnInit, OnDestroy {
  sizes: DigitaloceanSizes = {optimized: [], standard: []};
  filteredSizes: DigitaloceanSizes = {optimized: [], standard: []};
  hideOptional = false;

  readonly Controls = Controls;

  private readonly _debounceTime = 250;

  constructor(private readonly _builder: FormBuilder, private readonly _nodeDataService: NodeDataService) {
    super();
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Size]: this._builder.control('', Validators.required),
    });

    this._nodeDataService.nodeData = this._getNodeData();

    this._sizesObservable.pipe(takeUntil(this._unsubscribe)).subscribe(this._setDefaultSize.bind(this));

    this.form.controls.size.valueChanges.pipe(debounceTime(this._debounceTime), takeUntil(this._unsubscribe), startWith(''))
        .subscribe(value => {
          if (value !== '' && !this.form.controls.size.pristine) {
            this.filteredSizes = filterObjectOptions(value, 'slug', this.sizes);
          } else {
            this.filteredSizes = this.sizes;
          }
          this.form.controls.size.setValidators(
              [Validators.required, AutocompleteFilterValidators.mustBeInObjectList(this.sizes, 'slug', true)]);
          this.form.controls.size.updateValueAndValidity();
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

  private get _sizesObservable(): Observable<DigitaloceanSizes> {
    return this._nodeDataService.digitalOcean.flavors().pipe(catchError(() => of<DigitaloceanSizes>()));
  }

  private _setDefaultSize(sizes: DigitaloceanSizes): void {
    this.sizes = sizes;
    if (this.sizes && this.sizes.standard && this.sizes.standard.length > 0) {
      this.form.get(Controls.Size).setValue(this.sizes.standard[0].slug);
    }
  }

  private _getNodeData(): NodeData {
    return {
      spec: {
        cloud: {
          digitalocean: {
            size: this.form.get(Controls.Size).value,
          },
        } as NodeCloudSpec,
      } as NodeSpec,
    } as NodeData;
  }
}
