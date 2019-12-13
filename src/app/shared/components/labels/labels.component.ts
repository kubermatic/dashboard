import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';

@Component({
  selector: 'km-labels',
  templateUrl: './labels.component.html',
})
export class LabelsComponent implements OnInit, OnChanges {
  @Input() labels = {};
  @Input() limit: number;
  @Input() emptyMessage = 'No assigned labels';
  labelKeys: string[] = [];

  ngOnInit(): void {
    this._updateLabelKeys();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this._updateLabelKeys();
  }

  getHiddenLabels(): string {
    let hiddenLabels = '';
    for (let i = this.limit; i < this.labelKeys.length; i++) {
      hiddenLabels += this.labelKeys[i];
      if (this.labels[this.labelKeys[i]]) {
        hiddenLabels += `: ${this.labels[this.labelKeys[i]]}`;
      }
      if (i < this.labelKeys.length - 1) {
        hiddenLabels += ', ';
      }
    }
    return hiddenLabels;
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
