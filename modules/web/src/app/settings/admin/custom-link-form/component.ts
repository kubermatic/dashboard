// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {Component, EventEmitter, Input, OnDestroy, Output} from '@angular/core';
import {AbstractControl, FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {CustomLink, CustomLinkLocation} from '@shared/entity/settings';
import _ from 'lodash';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

enum Controls {
  CustomLinks = 'customLinks',
  Label = 'label',
  URL = 'url',
  Icon = 'icon',
  Location = 'location',
}

@Component({
  selector: 'km-custom-links-form',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  standalone: false,
})
export class CustomLinksFormComponent implements OnDestroy {
  readonly Location = CustomLinkLocation;
  readonly Controls = Controls;

  form: FormGroup;
  @Output() customLinksChange = new EventEmitter<CustomLink[]>();

  private _apiCustomLinks: CustomLink[] = [];
  private _customLinks: CustomLink[] = [];
  private _customLinksUpdated = new EventEmitter<void>();
  private _unsubscribe = new Subject<void>();

  @Input() set apiCustomLinks(links: CustomLink[]) {
    this._apiCustomLinks = links;
  }

  @Input()
  set customLinks(links: CustomLink[]) {
    if (_.isEqual(links, this._customLinks)) {
      return;
    }

    this._customLinks = links;
    this._customLinksUpdated.emit();
  }

  get customLinksArray(): FormArray {
    return this.form.get(Controls.CustomLinks) as FormArray;
  }

  constructor(private readonly _formBuilder: FormBuilder) {
    this.form = this._formBuilder.group({
      [Controls.CustomLinks]: this._formBuilder.array([
        this._formBuilder.group({
          [Controls.Label]: [{value: '', disabled: false}, Validators.required],
          [Controls.URL]: [{value: '', disabled: false}, Validators.required],
          [Controls.Icon]: [{value: '', disabled: false}],
          [Controls.Location]: [{value: CustomLinkLocation.Default, disabled: false}],
        }),
      ]),
    });

    this._customLinksUpdated.pipe(takeUntil(this._unsubscribe)).subscribe(_ => this._rebuildLinks());
  }

  private static _isFilled(customLink: AbstractControl): boolean {
    return customLink.get(Controls.Label).value.length !== 0 && customLink.get(Controls.URL).value.length !== 0;
  }

  ngOnDestroy() {
    this._unsubscribe.next();
    this._unsubscribe.complete();
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
    return this._apiCustomLinks && this._apiCustomLinks.filter(cl => _.isEqual(cl, customLink)).length > 0;
  }

  private _addLabelIfNeeded(): void {
    const lastLabel = this.customLinksArray.at(this.customLinksArray.length - 1);
    if (CustomLinksFormComponent._isFilled(lastLabel)) {
      this._addCustomLink();
    }
  }

  private _rebuildLinks(): void {
    const linksGroups = this._customLinks.map(link =>
      this._formBuilder.group({
        label: [{value: link.label, disabled: false}, Validators.required],
        url: [{value: link.url, disabled: false}, Validators.required],
        icon: [{value: link.icon, disabled: false}],
        location: [{value: link.location, disabled: false}],
      })
    );

    this.customLinksArray.clear();
    this.customLinksArray.controls = linksGroups;
    this._addCustomLink();
  }

  private _addCustomLink(label = '', url = '', icon = '', location = CustomLinkLocation.Default): void {
    const link = this._formBuilder.group({
      label: [{value: label, disabled: false}, Validators.required],
      url: [{value: url, disabled: false}, Validators.required],
      icon: [{value: icon, disabled: false}],
      location: [{value: location, disabled: false}],
    });

    this.customLinksArray.push(link);
  }

  private _updateLabelsObject(): void {
    const customLinks = [];
    this.customLinksArray.getRawValue().forEach(raw => {
      if (raw.label.length !== 0 && raw.url.length !== 0) {
        customLinks.push(raw);
      }
    });

    this._customLinks = customLinks;
    this.customLinksChange.emit(this._customLinks);
  }
}
