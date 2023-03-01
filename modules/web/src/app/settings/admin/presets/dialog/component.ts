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

import {Component, Inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup} from '@angular/forms';
import {
  MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
  MatLegacyDialogRef as MatDialogRef,
} from '@angular/material/legacy-dialog';
import {MatStepper} from '@angular/material/stepper';
import {PresetDialogService} from '@app/settings/admin/presets/dialog/steps/service';
import {NotificationService} from '@core/services/notification';
import {PresetsService} from '@core/services/wizard/presets';
import {Preset} from '@shared/entity/preset';
import {Observable, Subject} from 'rxjs';
import {filter, take, takeUntil} from 'rxjs/operators';

export interface PresetDialogData {
  title: string;
  mode: Mode;
  steps: StepRegistry[];
  preset: Preset;
  descriptionPreset?: string;
  descriptionProvider?: string;
  descriptionSettings?: string;
}

export enum Mode {
  Create = 'create',
  Add = 'add',
  Edit = 'edit',
}

enum StepRegistry {
  Preset = 'Preset',
  Provider = 'Provider',
  Settings = 'Settings',
}

@Component({
  selector: 'km-preset-dialog',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class PresetDialogComponent implements OnInit, OnDestroy {
  readonly stepRegistry = StepRegistry;
  readonly mode = Mode;

  form: FormGroup;
  creating = false;

  @ViewChild('stepper', {static: true}) private readonly _stepper: MatStepper;
  private _unsubscribe = new Subject<void>();

  constructor(
    private readonly _formBuilder: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: PresetDialogData,
    private readonly _presetDialogService: PresetDialogService,
    private readonly _presetService: PresetsService,
    private readonly _notificationService: NotificationService,
    private readonly _dialogRef: MatDialogRef<PresetDialogComponent>
  ) {}

  get title(): string {
    return this.data.title || 'Create Preset';
  }

  get steps(): StepRegistry[] {
    return this.data.steps;
  }

  get active(): string {
    return this.steps[this._stepper.selectedIndex];
  }

  get first(): boolean {
    return this._stepper.selectedIndex === 0;
  }

  get last(): boolean {
    return this._stepper.selectedIndex === this.steps.length - 1;
  }

  get invalid(): boolean {
    return (
      this.form.get(this.active).invalid ||
      (this.active === StepRegistry.Settings && !this._presetDialogService.isSettingsStepValid)
    );
  }

  get description(): string {
    switch (this.active) {
      case StepRegistry.Preset:
        return this.data.descriptionPreset;
      case StepRegistry.Provider:
        return this.data.descriptionProvider;
      case StepRegistry.Settings:
        return this.data.descriptionSettings;
      default:
        return '';
    }
  }

  get label(): string {
    switch (this.data.mode) {
      case Mode.Create:
        return 'Create';
      case Mode.Add:
        return 'Add';
      case Mode.Edit:
        return 'Save Changes';
      default:
        return '';
    }
  }

  get icon(): string {
    switch (this.data.mode) {
      case Mode.Create:
      case Mode.Add:
        return 'km-icon-add';
      case Mode.Edit:
        return 'km-icon-save';
      default:
        return '';
    }
  }

  getObservable(): Observable<Preset> {
    switch (this.data.mode) {
      case Mode.Create:
        return this._presetService.create(this._presetDialogService.preset).pipe(take(1));
      case Mode.Add:
      case Mode.Edit:
        this._presetDialogService.preset.metadata.name = this.data.preset.name;
        return this._presetService.update(this._presetDialogService.preset).pipe(take(1));
    }
  }

  onNext(preset: Preset): void {
    this._dialogRef.close(true);

    switch (this.data.mode) {
      case Mode.Create:
        this._notificationService.success(`Created the ${this._presetDialogService.preset.metadata.name} preset`);
        break;
      case Mode.Add:
      case Mode.Edit:
        this._notificationService.success(`Updated the ${preset.name} preset`);
    }
  }

  ngOnInit(): void {
    const controls = {};
    this.steps.forEach(step => (controls[step] = this._formBuilder.control('')));
    this.form = this._formBuilder.group(controls);

    this._presetDialogService.providerChanges
      .pipe(filter(provider => !!provider))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => this._stepper.next());

    this._stepper.selectionChange.pipe(takeUntil(this._unsubscribe)).subscribe(selection => {
      if (selection.previouslySelectedIndex > selection.selectedIndex) {
        selection.previouslySelectedStep.reset();
      }
    });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  isEnabled(step: StepRegistry): boolean {
    return this.steps.indexOf(step) > -1;
  }
}
