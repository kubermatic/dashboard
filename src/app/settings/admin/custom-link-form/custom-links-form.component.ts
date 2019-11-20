import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {AbstractControl, FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';

import {CustomLink} from '../../../shared/utils/custom-link-utils/custom-link';

@Component({
  selector: 'km-custom-links-form',
  templateUrl: './custom-links-form.component.html',
  styleUrls: ['./custom-links-form.component.scss'],
})
export class CustomLinksFormComponent implements OnInit {
  @Input() customLinks: CustomLink[] = [];
  @Output() customLinksChange = new EventEmitter<CustomLink[]>();
  initialcustomLinks: CustomLink[];
  form: FormGroup;

  constructor(private readonly _formBuilder: FormBuilder) {}

  get customLinksArray(): FormArray {
    return this.form.get('customLinks') as FormArray;
  }

  ngOnInit(): void {
    this.initialcustomLinks = this.customLinks;
    this.form = this._formBuilder.group({customLinks: this._formBuilder.array([])});
    this.customLinks.forEach(customLink => this._addCustomLink(customLink.label, customLink.url));
    this._addCustomLink();
  }

  isRemovable(index: number): boolean {
    return index < this.customLinksArray.length - 1;
  }

  deleteLabel(index: number): void {
    this.customLinksArray.removeAt(index);
    this._updateLabelsObject();
  }

  check(): void {
    this._addLabelIfNeeded();
    this._updateLabelsObject();
  }

  private static _isFilled(customLink: AbstractControl): boolean {
    return customLink.get('label').value.length !== 0 && customLink.get('url').value.length !== 0;
  }

  private _addLabelIfNeeded(): void {
    const lastLabel = this.customLinksArray.at(this.customLinksArray.length - 1);
    if (CustomLinksFormComponent._isFilled(lastLabel)) {
      this._addCustomLink();
    }
  }

  private _addCustomLink(label = '', url = ''): void {
    this.customLinksArray.push(this._formBuilder.group({
      label: [{value: label, disabled: false}, Validators.required],
      url: [{value: url, disabled: false}, Validators.required],
    }));
  }

  private _updateLabelsObject(): void {
    const customLinks = [];
    this.customLinksArray.getRawValue().forEach(raw => {
      if (raw.label.length !== 0 && raw.url.length !== 0) {
        customLinks.push({label: raw.label, url: raw.url} as CustomLink);
      }
    });

    // Nullify initial labels data (it is needed to make edit work as it uses JSON Merge Patch).
    // Object.keys(this.initialcustomLinks).forEach(initialKey => {
    //   if (!labelsObject.hasOwnProperty(initialKey)) {
    //     labelsObject[initialKey] = null;
    //   }
    // });

    this.customLinks = customLinks;
    this.customLinksChange.emit(this.customLinks);
  }
}
