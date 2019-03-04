import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';

@Component({
  selector: 'km-labels',
  templateUrl: './labels.component.html',
})
export class LabelsComponent implements OnInit, OnChanges {
  @Input() labels: object = {};
  labelKeys: string[] = [];

  ngOnInit(): void {
    this._updateLabelKeys();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this._updateLabelKeys();
  }

  private _updateLabelKeys(): void {
    this.labelKeys = this.labels instanceof Object ? Object.keys(this.labels) : [];
  }
}
