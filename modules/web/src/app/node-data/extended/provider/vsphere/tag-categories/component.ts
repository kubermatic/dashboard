// Copyright 2023 The Kubermatic Kubernetes Platform contributors.
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

import {ChangeDetectorRef, Component, EventEmitter, forwardRef, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  Validators,
} from '@angular/forms';
import {VSphereTag} from '@app/shared/entity/node';
import {ClusterSpecService} from '@core/services/cluster-spec';
import {NodeDataService} from '@core/services/node-data/service';
import {VSphereTags} from '@shared/entity/cluster';
import {VSphereTagCategory} from '@shared/entity/provider/vsphere';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import _ from 'lodash';
import {Observable, Subscription} from 'rxjs';
import {distinctUntilChanged, takeUntil} from 'rxjs/operators';

enum Controls {
  Tags = 'tags',
  Category = 'category',
  Tag = 'tag',
}

enum CategoryState {
  Empty = 'No Categories Available',
  Loading = 'Loading...',
  Ready = 'Category',
}

enum TagState {
  Empty = 'No Tags Available',
  Loading = 'Loading...',
  Ready = 'Tag',
}

@Component({
  selector: 'km-vsphere-tags',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => VSphereTagsComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => VSphereTagsComponent),
      multi: true,
    },
  ],
})
export class VSphereTagsComponent extends BaseFormValidator implements OnInit, OnDestroy {
  readonly Controls = Controls;
  readonly CategoryState = CategoryState;
  readonly TagState = TagState;

  @Input() tags: VSphereTag[];
  @Output() tagsChange = new EventEmitter<VSphereTag[]>();

  form: FormGroup;
  categories: VSphereTagCategory[];
  categoryLabel: CategoryState = CategoryState.Empty;
  categoryTags: Record<string, VSphereTag[]> = {};
  categoryTagsLabel: Record<string, TagState> = {};
  categoryTagsSubscription: Record<string, Subscription> = {};
  clusterCategory: VSphereTagCategory;
  disabledTags: string[];

  private _clusterTags: VSphereTags;

  constructor(
    private readonly _formBuilder: FormBuilder,
    private readonly _nodeDataService: NodeDataService,
    private readonly _clusterSpecService: ClusterSpecService,
    private readonly _cdr: ChangeDetectorRef
  ) {
    super();
  }

  get tagsFormArray(): FormArray {
    return this.form.get(Controls.Tags) as FormArray;
  }

  ngOnInit(): void {
    this.form = this._formBuilder.group({[Controls.Tags]: this._formBuilder.array([])});

    if (!this.tags) {
      this.tags = [];
    }

    // Setup tags form with tag data.
    this.tags.forEach(tag => {
      this._addTag(tag);
    });

    // Add initial tag for the user.
    this._addTag();

    this._categoriesObservable.pipe(takeUntil(this._unsubscribe)).subscribe(this._setCategories.bind(this));

    this._clusterSpecService.providerSpecChanges.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
      const clusterTags = this._clusterSpecService.cluster.spec.cloud.vsphere.tags;

      if (!_.isEqual(this._clusterTags, clusterTags)) {
        this._clusterTags = _.cloneDeep(clusterTags);
        if (this._clusterTags) {
          this.disabledTags = this._clusterTags.tags;
          if (this.categories?.length) {
            this.clusterCategory = this.categories.find(category => category.id === this._clusterTags.categoryID);
          }
        } else {
          this.clusterCategory = null;
          this.disabledTags = null;
        }
        this._updateTags();
        this._cdr.detectChanges();
      }
    });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getSelectedCategory(control: AbstractControl): string {
    return control.get(Controls.Category).value;
  }

  isRemovable(index: number): boolean {
    return index < this.tagsFormArray.length - 1;
  }

  deleteDisabledTag(index: number): void {
    this.disabledTags.splice(index, 1);
    this._updateTags();
  }

  deleteTag(index: number): void {
    const selectedCategory = this.tagsFormArray.at(index).get(Controls.Category).value;
    this.tagsFormArray.removeAt(index);
    if (selectedCategory && this.categoryTagsSubscription[selectedCategory]) {
      const selectedCategoryControl = this.tagsFormArray.controls.find(
        control => control.get(Controls.Category).value === selectedCategory
      );
      if (!selectedCategoryControl) {
        this.categoryTagsSubscription[selectedCategory].unsubscribe();
        delete this.categoryTagsSubscription[selectedCategory];
      }
    }
    this._updateTags();
  }

  private static _isFilled(tag: AbstractControl): boolean {
    return tag.get(Controls.Category).value || tag.get(Controls.Tag).value;
  }

  private get _categoriesObservable(): Observable<VSphereTagCategory[]> {
    return this._nodeDataService.vsphere.categories(this._clearCategory.bind(this), this._onCategoryLoading.bind(this));
  }

  private _onCategoryLoading(): void {
    this.categoryLabel = CategoryState.Loading;
    this._cdr.detectChanges();
  }

  private _clearCategory(): void {
    this.categories = [];
    this.categoryLabel = CategoryState.Empty;
    this._cdr.detectChanges();
  }

  private _setCategories(categories: VSphereTagCategory[]): void {
    this.categories = categories;
    const categoryID = this._clusterSpecService.cluster.spec.cloud.vsphere?.tags?.categoryID;
    if (categoryID) {
      this.clusterCategory = this.categories.find(category => category.id === categoryID);
    }
    this.categoryLabel = categories?.length ? CategoryState.Ready : CategoryState.Empty;
    this._cdr.detectChanges();
  }

  private _addTag(tag: VSphereTag = null): void {
    this.tagsFormArray.controls.forEach(control => {
      control.get(Controls.Category).setValidators(Validators.required);
      control.get(Controls.Tag).setValidators(Validators.required);
    });
    this.form.updateValueAndValidity({emitEvent: false});

    const categoryControl = this._formBuilder.control(tag?.categoryID || '');
    const tagControl = this._formBuilder.control(tag?.name || '');
    const formGroupControl = this._formBuilder.group({
      [Controls.Category]: categoryControl,
      [Controls.Tag]: tagControl,
    });
    this.tagsFormArray.push(formGroupControl);

    formGroupControl.valueChanges
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => this._onControlValueChange(formGroupControl));

    categoryControl.valueChanges
      .pipe(takeUntil(this._unsubscribe))
      .pipe(distinctUntilChanged())
      .subscribe(selectedCategory => {
        tagControl.setValue(null);
        this._loadCategoryTags(selectedCategory);
      });

    if (tag?.categoryID) {
      this._loadCategoryTags(tag.categoryID);
    }
  }

  private _onControlValueChange(control: AbstractControl): void {
    this._addTagIfNeeded();
    this._validateTag(control);
    this._updateTags();
  }

  private _addTagIfNeeded(): void {
    const lastTag = this.tagsFormArray.at(this.tagsFormArray.length - 1);
    if (VSphereTagsComponent._isFilled(lastTag)) {
      this._addTag();
    }
  }

  private _loadCategoryTags(category: string): void {
    if (category && !this.categoryTagsSubscription[category]) {
      this.categoryTagsSubscription[category] = this._nodeDataService.vsphere
        .categoryTags(
          category,
          this._clearCategoryTag.bind(this, category),
          this._onCategoryTagLoading.bind(this, category)
        )
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(this._setCategoryTags.bind(this, category));
    }
  }

  private _onCategoryTagLoading(category: string): void {
    this._clearCategoryTag(category);
    this.categoryTagsLabel[category] = TagState.Loading;
    this._cdr.detectChanges();
  }

  private _clearCategoryTag(category: string): void {
    this.categoryTags[category] = [];
    this.categoryTagsLabel[category] = TagState.Empty;
    this._cdr.detectChanges();
  }

  private _setCategoryTags(category: string, tags: VSphereTag[]): void {
    this.categoryTags[category] = tags;
    const categoryTagControls = this.tagsFormArray.controls.filter(
      control => control.get(Controls.Category).value === category
    );
    if (categoryTagControls.length) {
      categoryTagControls.forEach(control => {
        const tagControl = control.get(Controls.Tag);
        if (!tags.find(tag => tag.name === tagControl.value)) {
          tagControl.setValue(null);
        }
      });
    }

    this.categoryTagsLabel[category] = tags?.length ? TagState.Ready : TagState.Empty;
    this._cdr.detectChanges();
  }

  private _validateTag(control: AbstractControl): void {
    const selectedCategory = control.get(Controls.Category).value;
    const tagControl = control.get(Controls.Tag);
    const selectedTag = tagControl.value;
    const isDuplicate =
      this.tagsFormArray.controls.filter(
        item => item.get(Controls.Category).value === selectedCategory && item.get(Controls.Tag).value === selectedTag
      ).length > 1;

    if (selectedTag) {
      if (isDuplicate) {
        tagControl.setErrors({unique: true});
      } else {
        tagControl.setErrors(null);
      }
    }
    this.form.updateValueAndValidity();
  }

  private _updateTags(): void {
    const tags: VSphereTag[] = [];
    if (this.disabledTags) {
      this.disabledTags.forEach(tag => {
        tags.push({
          categoryID: this.clusterCategory.id,
          name: tag,
        } as VSphereTag);
      });
    }
    if (this.tagsFormArray.length) {
      this.tagsFormArray.controls.forEach(control => {
        const category = control.get(Controls.Category).value;
        const tag = control.get(Controls.Tag).value;
        if (category && tag) {
          tags.push({
            categoryID: category,
            name: tag,
          } as VSphereTag);
        }
      });
    }
    this.tagsChange.emit(tags);
  }
}
