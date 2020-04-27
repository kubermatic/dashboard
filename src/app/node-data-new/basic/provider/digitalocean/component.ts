import {ChangeDetectionStrategy, ChangeDetectorRef, Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {Observable} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {DigitaloceanSizes, Optimized, Standard} from '../../../../shared/entity/provider/digitalocean/DropletSizeEntity';
import {BaseFormValidator} from '../../../../shared/validators/base-form.validator';
import {NodeDataService} from '../../../service/service';

enum Controls {
  Size = 'size',
}

enum SizeTypes {
  Optimized = 'Optimized Droplets',
  Standard = 'Standard Droplets',
}

enum SizeState {
  Ready = 'Node Size',
  Loading = 'Loading...',
  Empty = 'No Sizes Available',
}

@Component({
  selector: 'km-digitalocean-basic-node-data',
  templateUrl: './template.html',
  providers: [
    {provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DigitalOceanBasicNodeDataComponent), multi: true},
    {provide: NG_VALIDATORS, useExisting: forwardRef(() => DigitalOceanBasicNodeDataComponent), multi: true}
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DigitalOceanBasicNodeDataComponent extends BaseFormValidator implements OnInit, OnDestroy {
  private _sizes: DigitaloceanSizes = DigitaloceanSizes.newDigitalOceanSizes();

  readonly Controls = Controls;

  selectedSize = '';
  sizeLabel = SizeState.Empty;

  get sizeTypes(): string[] {
    return Object.values(SizeTypes);
  }

  constructor(
      private readonly _builder: FormBuilder, private readonly _nodeDataService: NodeDataService,
      private readonly _cdr: ChangeDetectorRef) {
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

  getTypes(group: SizeTypes): Optimized[]|Standard[] {
    const key = Object.keys(SizeTypes).find(key => SizeTypes[key] === group);
    return this._sizes[key.toLowerCase()];
  }

  onTypeChange(size: string): void {
    this._nodeDataService.nodeData.spec.cloud.digitalocean.size = size;
  }

  sizeDisplayName(slug: string): string {
    const size = [...this._sizes.optimized, ...this._sizes.standard].find(size => size.slug === slug);
    return size ? `${size.slug} (${size.memory / 1024} GB RAM, ${size.vcpus} CPU${(size.vcpus !== 1) ? 's' : ''}, $${
                      size.price_monthly} per month)` :
                  '';
  }

  private get _sizesObservable(): Observable<DigitaloceanSizes> {
    return this._nodeDataService.digitalOcean.flavors(this._clearSize.bind(this), this._onSizeLoading.bind(this));
  }

  private _onSizeLoading(): void {
    this._clearSize();
    this.sizeLabel = SizeState.Loading;
  }

  private _clearSize(): void {
    this.selectedSize = '';
    this._sizes = DigitaloceanSizes.newDigitalOceanSizes();
    this.sizeLabel = SizeState.Empty;
    this._cdr.detectChanges();
  }

  private _setDefaultSize(sizes: DigitaloceanSizes): void {
    this._sizes = sizes;
    if (this._sizes && this._sizes.standard && this._sizes.standard.length > 0) {
      this.selectedSize = this._sizes.standard[0].slug;
      this.sizeLabel = SizeState.Ready;
      this._cdr.detectChanges();
    }
  }
}
