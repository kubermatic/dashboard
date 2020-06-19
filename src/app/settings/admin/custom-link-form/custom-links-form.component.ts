import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {AbstractControl, FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';
import * as _ from 'lodash';
import {CustomLink, CustomLinkLocation} from '../../../shared/entity/settings';

@Component({
  selector: 'km-custom-links-form',
  templateUrl: './custom-links-form.component.html',
  styleUrls: ['./custom-links-form.component.scss'],
})
export class CustomLinksFormComponent implements OnInit, OnChanges {
  @Input() customLinks: CustomLink[] = [];
  @Output() customLinksChange = new EventEmitter<CustomLink[]>();
  @Input() apiCustomLinks: CustomLink[] = [];
  form: FormGroup;

  constructor(private readonly _formBuilder: FormBuilder) {}

  get customLinksArray(): FormArray {
    return this.form.get('customLinks') as FormArray;
  }

  ngOnInit(): void {
    this._buildForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.customLinks.currentValue !== changes.customLinks.previousValue) {
      this._buildForm();
    }
  }

  private _buildForm(): void {
    this.form = this._formBuilder.group({
      customLinks: this._formBuilder.array([]),
    });
    this.customLinks.forEach(customLink =>
      this._addCustomLink(customLink.label, customLink.url, customLink.icon, customLink.location)
    );
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

  isSaved(index: number): boolean {
    const customLink = this.customLinksArray.getRawValue()[index] as CustomLink;

    // Check save status only for valid links, invalid will not be saved anyways.
    if (!customLink.label || !customLink.url) {
      return true;
    }

    // Check if link is already part of links returned from the API.
    return this.apiCustomLinks && this.apiCustomLinks.filter(cl => _.isEqual(cl, customLink)).length > 0;
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

  private _addCustomLink(label = '', url = '', icon = '', location = CustomLinkLocation.Default): void {
    this.customLinksArray.push(
      this._formBuilder.group({
        label: [{value: label, disabled: false}, Validators.required],
        url: [{value: url, disabled: false}, Validators.required],
        icon: [{value: icon, disabled: false}],
        location: [{value: location, disabled: false}],
      })
    );
  }

  private _updateLabelsObject(): void {
    const customLinks = [];
    this.customLinksArray.getRawValue().forEach(raw => {
      if (raw.label.length !== 0 && raw.url.length !== 0) {
        customLinks.push(raw);
      }
    });

    this.customLinks = customLinks;
    this.customLinksChange.emit(this.customLinks);
  }
}
