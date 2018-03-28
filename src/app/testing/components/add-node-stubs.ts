import { CommonModule } from '@angular/common';
import { Provider } from './../../shared/interfaces/provider.interface';
import { Component, EventEmitter, Input, NgModule, Output } from '@angular/core';
import { FormGroup } from '@angular/forms/src/model';
import { NodeEntity } from '../../shared/entity/NodeEntity';

@Component({
  selector: 'kubermatic-add-node',
  template: '',
})
export class AddNodeStubComponent {
  @Input() provider: Provider;
  @Input() connect: string[] = [];
  @Output() nodeChanges: EventEmitter<NodeEntity> = new EventEmitter();
  @Output() formChanges: EventEmitter<FormGroup> = new EventEmitter();
}

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [
    AddNodeStubComponent
  ],
  exports: [
    AddNodeStubComponent
  ]
})
export class AddNodeStubsModule {
}
