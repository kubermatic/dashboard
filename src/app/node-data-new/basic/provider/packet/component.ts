import {Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {Observable, of} from 'rxjs';
import {catchError, debounceTime, startWith, takeUntil} from 'rxjs/operators';

import {NodeCloudSpec, NodeSpec} from '../../../../shared/entity/NodeEntity';
import {PacketSize} from '../../../../shared/entity/packet/PacketSizeEntity';
import {NodeData} from '../../../../shared/model/NodeSpecChange';
import {filterArrayOptions} from '../../../../shared/utils/common-utils';
import {AutocompleteFilterValidators} from '../../../../shared/validators/autocomplete-filter.validator';
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
  filteredSizes: PacketSize[] = [];

  readonly Controls = Controls;

  private readonly _debounceTime = 250;

  constructor(private readonly _builder: FormBuilder, private readonly _nodeDataService: NodeDataService) {
    super();
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.InstanceType]: this._builder.control('', Validators.required),
    });

    this._nodeDataService.nodeData = this._getNodeData();

    this._typesObservable.pipe(takeUntil(this._unsubscribe)).subscribe(this._setDefaultType.bind(this));

    this.form.get(Controls.InstanceType)
        .valueChanges.pipe(debounceTime(this._debounceTime), takeUntil(this._unsubscribe), startWith(''))
        .subscribe(value => {
          if (value !== '' && !this.form.get(Controls.InstanceType).pristine) {
            this.filteredSizes = filterArrayOptions(value, 'name', this.sizes);
          } else {
            this.filteredSizes = this.sizes;
          }
          this.form.get(Controls.InstanceType).setValidators([
            Validators.required, AutocompleteFilterValidators.mustBeInArrayList(this.sizes, 'name', true)
          ]);
          this.form.get(Controls.InstanceType).updateValueAndValidity();
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
    sizes.forEach(size => {
      if (size.memory !== 'N/A') {
        this.sizes.push(size);
      }
    });
    if (this.sizes && this.sizes.length > 0) {
      this.form.get(Controls.InstanceType).setValue(this.sizes[0].name);
    }
  }

  private _getNodeData(): NodeData {
    return {
      spec: {
        cloud: {
          packet: {
            instanceType: this.form.get(Controls.InstanceType).value,
          },
        } as NodeCloudSpec,
      } as NodeSpec,
    } as NodeData;
  }
}
