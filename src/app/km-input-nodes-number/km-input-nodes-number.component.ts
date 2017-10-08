import { Component, OnInit, Input, ElementRef, ViewChild, Renderer2,AfterViewInit } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
@Component({
  selector: 'km-input-nodes-number',
  templateUrl: './km-input-nodes-number.component.html',
  styleUrls: ['./km-input-nodes-number.component.scss']
})
export class KmInputNodesNumberComponent {
  @Input() min: number;
  @Input() max: number;
  @Input() form: FormGroup;
  @Input() inputId: string;

  constructor() {}

  public increaseValue(increase: boolean): void {
    let value = this.form.controls['node_count'].value;
    increase ? value++ : value--;
    value = value > this.max ? this.max : 
      value < this.min ? this.min : value;
      
    this.form.controls['node_count'].setValue(value);  
  }

  public onInputChange(value: number): void {
    this.form.controls['node_count'].setValue(value);
  }
}
