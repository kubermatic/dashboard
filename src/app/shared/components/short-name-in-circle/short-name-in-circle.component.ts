import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {ProjectOwners} from '../../entity/ProjectEntity';

@Component({
  selector: 'km-short-name-in-circle',
  templateUrl: './short-name-in-circle.component.html',
  styleUrls: ['./short-name-in-circle.component.scss'],
})
export class ShortNameInCircleComponent implements OnInit, OnChanges {
  @Input() owners: ProjectOwners[];
  @Input() limit: number;
  shortNames: string[] = [];

  ngOnInit(): void {
    this._updateLabelKeys();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this._updateLabelKeys();
  }

  getHiddenOwners(): string {
    const hiddenOwners = [];
    for (const i in this.owners) {
      if (this.owners.hasOwnProperty(i)) {
        hiddenOwners.push(this.owners[i].name);
      }
    }
    return hiddenOwners.join(', ');
  }

  private _updateLabelKeys(): void {
    this.shortNames = [];
    for (const owner in this.owners) {
      if (this.owners.hasOwnProperty(owner)) {
        const capitalLetters = this.owners[owner].name.match(/\b(\w)/g);
        const short = capitalLetters.join('').toUpperCase();
        this.shortNames.push(short);
      }
    }
  }
}
