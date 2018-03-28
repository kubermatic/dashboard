import { FormGroup } from '@angular/forms';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'kubermatic-add-node-form',
  templateUrl: './add-node-form.component.html',
  styleUrls: ['./add-node-form.component.scss']
})
export class AddNodeFormComponent {

  @Output() change: EventEmitter<any> = new EventEmitter();
  @Input() connect: string[] = [];
  @Input() formGroup: FormGroup;

  constructor() { }

  onChange() {
    this.change.emit();
  }

}
