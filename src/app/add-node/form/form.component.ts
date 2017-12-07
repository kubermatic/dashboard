import { FormGroup } from '@angular/forms';
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'kubermatic-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss']
})
export class FormComponent implements OnInit {

  @Output() change: EventEmitter<any> = new EventEmitter();
  @Input() connect: string[] = [];
  @Input() formGroup: FormGroup;

  constructor() { }

  ngOnInit() {
    console.log(this.connect);
  }

  onChange() {
    this.change.emit();
  }

}
