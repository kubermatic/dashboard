import {ChangeDetectionStrategy, ChangeDetectorRef, Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {Observable, of} from 'rxjs';
import {catchError, takeUntil} from 'rxjs/operators';

import {PresetsService} from '../../../../core/services';
import {AzureSizes} from '../../../../shared/entity/provider/azure/AzureSizeEntity';
import {BaseFormValidator} from '../../../../shared/validators/base-form.validator';
import {NodeDataService} from '../../../service/service';

enum Controls {
  Size = 'size',
}

enum SizeState {
  Ready = 'Node Size',
  Loading = 'Loading...',
  Empty = 'No Sizes Available',
}

@Component({
  selector: 'km-azure-basic-node-data',
  templateUrl: './template.html',
  providers: [
    {provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => AzureBasicNodeDataComponent), multi: true},
    {provide: NG_VALIDATORS, useExisting: forwardRef(() => AzureBasicNodeDataComponent), multi: true}
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AzureBasicNodeDataComponent extends BaseFormValidator implements OnInit, OnDestroy {
  sizes: AzureSizes[] = [];
  sizeLabel = SizeState.Empty;
  selectedSize = '';

  readonly Controls = Controls;

  constructor(
      private readonly _builder: FormBuilder, private readonly _presets: PresetsService,
      private readonly _nodeDataService: NodeDataService, private readonly _cdr: ChangeDetectorRef) {
    super();
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Size]: this._builder.control('', Validators.required),
    });

    this._presets.presetChanges.pipe(takeUntil(this._unsubscribe)).subscribe(this._clearSize.bind(this));
    this._sizesObservable.pipe(takeUntil(this._unsubscribe)).subscribe(this._setDefaultSize.bind(this));
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  onSizeChange(size: string): void {
    this._nodeDataService.nodeData.spec.cloud.azure.size = size;
  }

  private get _sizesObservable(): Observable<AzureSizes[]> {
    return this._nodeDataService.azure.flavors(this._onSizeLoading.bind(this)).pipe(catchError(() => of([])));
  }

  private _onSizeLoading(): void {
    this.sizeLabel = SizeState.Loading;
    this._clearSize();
  }

  private _clearSize(): void {
    this.selectedSize = '';
    this.sizes = [];
    this._cdr.detectChanges();
  }

  private _setDefaultSize(sizes: AzureSizes[]): void {
    this.sizes = sizes;
    this.selectedSize = '';
    this.sizeLabel = SizeState.Empty;

    if (this.sizes.length > 0) {
      this.selectedSize = this.sizes[0].name;
      this.sizeLabel = SizeState.Ready;
    }

    this._cdr.detectChanges();
  }
}
