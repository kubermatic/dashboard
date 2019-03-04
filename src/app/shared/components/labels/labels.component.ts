import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'km-labels',
  templateUrl: './labels.component.html',
})
export class LabelsComponent implements OnInit {
  @Input() labels: object = {};
  labelKeys: string[] = [];

  ngOnInit(): void {
    this.labelKeys = this.labels instanceof Object ? Object.keys(this.labels) : [];
  }
}
