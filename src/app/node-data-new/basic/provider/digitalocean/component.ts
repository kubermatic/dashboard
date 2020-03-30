import {Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {Observable, of} from 'rxjs';
import {catchError, takeUntil} from 'rxjs/operators';
import {DigitaloceanSizes} from '../../../../shared/entity/provider/digitalocean/DropletSizeEntity';
import {Type} from '../../../../shared/entity/provider/hetzner/TypeEntity';
import {BaseFormValidator} from '../../../../shared/validators/base-form.validator';
import {NodeDataService} from '../../../service/service';

enum Controls {
  Size = 'size',
}

enum SizeTypes {
  Optimized = 'Optimized Droplets',
  Standard = 'Standard Droplets',
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
  selectedSize = '';

  readonly Controls = Controls;

  get sizeTypes(): string[] {
    return Object.values(SizeTypes);
  }

  constructor(private readonly _builder: FormBuilder, private readonly _nodeDataService: NodeDataService) {
    super();
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Size]: this._builder.control('', Validators.required),
    });

    this._sizesObservable.pipe(takeUntil(this._unsubscribe)).subscribe(this._setDefaultSize.bind(this));
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getTypes(group: SizeTypes): Type[] {
    const key = Object.keys(SizeTypes).find(key => SizeTypes[key] === group);
    return this.sizes[key.toLowerCase()];
  }

  onTypeChange(size: string): void {
    this._nodeDataService.nodeData.spec.cloud.digitalocean.size = size;
  }

  private get _sizesObservable(): Observable<DigitaloceanSizes> {
    return this._nodeDataService.digitalOcean.flavors().pipe(catchError(() => of<DigitaloceanSizes>()));
  }

  private _setDefaultSize(sizes: DigitaloceanSizes): void {
    this.sizes = sizes;
    if (this.sizes && this.sizes.standard && this.sizes.standard.length > 0) {
      this.selectedSize = this.sizes.standard[0].slug;
    }
  }
}
