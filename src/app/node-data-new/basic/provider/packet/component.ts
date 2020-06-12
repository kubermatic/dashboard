import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  forwardRef,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {Observable} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {PacketNodeSpec} from '../../../../shared/entity/node/PacketNodeSpec';
import {NodeCloudSpec, NodeSpec} from '../../../../shared/entity/node';
import {PacketSize} from '../../../../shared/entity/packet/PacketSizeEntity';
import {NodeData} from '../../../../shared/model/NodeSpecChange';
import {BaseFormValidator} from '../../../../shared/validators/base-form.validator';
import {NodeDataService} from '../../../service/service';

enum Controls {
  InstanceType = 'instanceType',
}

enum SizeState {
  Ready = 'Plan',
  Loading = 'Loading...',
  Empty = 'No Plans Available',
}

@Component({
  selector: 'km-packet-basic-node-data',
  templateUrl: './template.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PacketBasicNodeDataComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => PacketBasicNodeDataComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PacketBasicNodeDataComponent extends BaseFormValidator implements OnInit, OnDestroy, AfterViewInit {
  readonly Controls = Controls;

  sizes: PacketSize[] = [];
  selectedSize = '';
  sizeLabel = SizeState.Empty;

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _nodeDataService: NodeDataService,
    private readonly _cdr: ChangeDetectorRef
  ) {
    super();
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.InstanceType]: this._builder.control('', Validators.required),
    });
  }

  ngAfterViewInit() {
    this._sizesObservable.pipe(takeUntil(this._unsubscribe)).subscribe(this._setDefaultSize.bind(this));
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  onSizeChange(size: string): void {
    this._nodeDataService.nodeData = {
      spec: {
        cloud: {
          packet: {
            instanceType: size,
          } as PacketNodeSpec,
        } as NodeCloudSpec,
      } as NodeSpec,
    } as NodeData;
  }

  getPlanDetails(size: PacketSize): string {
    let description = '';
    size.drives = size.drives ? size.drives : [];
    size.cpus = size.cpus ? size.cpus : [];

    for (const cpu of size.cpus) {
      description += `${cpu.count} CPU(s) ${cpu.type}`;
    }

    if (size.memory && size.memory !== 'N/A') {
      description += `, ${size.memory} RAM`;
    }

    for (const drive of size.drives) {
      description += `, ${drive.count}x${drive.size} ${drive.type}`;
    }

    return description ? `(${description})` : '';
  }

  private get _sizesObservable(): Observable<PacketSize[]> {
    return this._nodeDataService.packet.flavors(this._clearSize.bind(this), this._onSizeLoading.bind(this));
  }

  private _onSizeLoading(): void {
    this._clearSize();
    this.sizeLabel = SizeState.Loading;
    this._cdr.detectChanges();
  }

  private _clearSize(): void {
    this.selectedSize = '';
    this.sizes = [];
    this.sizeLabel = SizeState.Empty;
    this._cdr.detectChanges();
  }

  private _setDefaultSize(sizes: PacketSize[]): void {
    this.sizes = sizes.filter(size => size.memory !== 'N/A');
    if (this.sizes && this.sizes.length > 0) {
      this.selectedSize = this.sizes[0].name;
      this.sizeLabel = SizeState.Ready;
      this._cdr.detectChanges();
    }
  }
}
