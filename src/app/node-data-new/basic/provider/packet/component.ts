import {Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {Observable, of} from 'rxjs';
import {catchError, takeUntil} from 'rxjs/operators';
import {PacketSize} from '../../../../shared/entity/packet/PacketSizeEntity';
import {BaseFormValidator} from '../../../../shared/validators/base-form.validator';
import {NodeDataService} from '../../../service/service';

enum Controls {
  InstanceType = 'instanceType',
}

@Component({
  selector: 'km-packet-basic-node-data',
  templateUrl: './template.html',
  providers: [
    {provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => PacketBasicNodeDataComponent), multi: true},
    {provide: NG_VALIDATORS, useExisting: forwardRef(() => PacketBasicNodeDataComponent), multi: true}
  ]
})
export class PacketBasicNodeDataComponent extends BaseFormValidator implements OnInit, OnDestroy {
  sizes: PacketSize[] = [];
  selectedSize = '';

  readonly Controls = Controls;

  constructor(private readonly _builder: FormBuilder, private readonly _nodeDataService: NodeDataService) {
    super();
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.InstanceType]: this._builder.control('', Validators.required),
    });

    this._typesObservable.pipe(takeUntil(this._unsubscribe)).subscribe(this._setDefaultType.bind(this));
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  onSizeChange(size: string): void {
    this._nodeDataService.nodeData.spec.cloud.packet.instanceType = size;
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

  private get _typesObservable(): Observable<PacketSize[]> {
    return this._nodeDataService.packet.flavors().pipe(catchError(() => of<PacketSize[]>()));
  }

  private _setDefaultType(sizes: PacketSize[]): void {
    this.sizes = sizes.filter(size => size.memory !== 'N/A');
    if (this.sizes && this.sizes.length > 0) {
      this.selectedSize = this.sizes[0].name;
    }
  }
}
