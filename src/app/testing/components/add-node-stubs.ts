import { CommonModule } from '@angular/common';
import { Provider } from './../../shared/interfaces/provider.interface';
import { Component, Input, Output, EventEmitter, NgModule } from '@angular/core';
import { CreateNodeModel } from '../../shared/model/CreateNodeModel';
import { FormGroup } from '@angular/forms/src/model';

@Component({
  selector: 'kubermatic-add-node',
  template: '',
})
export class AddNodeStubComponent {
  @Input() provider: Provider;
  @Input() connect: string[] = [];
  @Output() nodeModelChanges: EventEmitter<CreateNodeModel> = new EventEmitter();
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
export class AddNodeStubsModule { }
