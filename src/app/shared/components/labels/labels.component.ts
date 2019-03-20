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
    this.labelKeys = [];
    if (Array.isArray(this.labels)) {
      this.labelKeys = this.labels;
    } else {
      if (this.labels instanceof Object) {
        Object.keys(this.labels).forEach(key => {
          // Do not display nullified (marked for removal) labels.
          if (this.labels[key] !== null) {
            this.labelKeys.push(key);
          }
        });
      }
    }
  }
}
