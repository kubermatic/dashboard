// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {AfterViewInit, Directive, Input, OnDestroy, ViewContainerRef, ElementRef} from '@angular/core';
import {Subject} from 'rxjs';

import {GuidedTourStep} from './entity';
import {DialogService} from './dialog/service';

@Directive({
  selector: 'kmGuidedTour, [kmGuidedTour]',
})
export class GuidedTourDirective implements AfterViewInit, OnDestroy {
  @Input('kmGuidedTour') id: string;

  private _step: GuidedTourStep;
  private readonly _unsubscribe = new Subject<void>();

  constructor(
    private readonly _dialogService: DialogService,
    private readonly _viewContainerRef: ViewContainerRef,
    private elementRef: ElementRef
  ) {
    this._step = new GuidedTourStep();
  }

  ngAfterViewInit(): void {
    this._step.targetViewContainer = this._viewContainerRef;
    this._step.elementRef = this.elementRef;
    this._step.id = this.id;

    this._dialogService.addStep(this._step);
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }
}
