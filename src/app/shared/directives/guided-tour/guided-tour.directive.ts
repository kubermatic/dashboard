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

import {
  AfterViewInit,
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  ViewContainerRef,
  Output,
} from '@angular/core';
import {Router} from '@angular/router';
import {Subject} from 'rxjs';

import {GuidedTourStep, GuidedTourItem} from '../../entity/guided-tour';
import {GuidedTourItemsService} from '../../../core/services/guided-tour/guided-tour-items.service';
import {GuidedTourStepsContainerService} from '../../../core/services/guided-tour/guided-tour-steps-container.service';

@Directive({
  selector: 'kmGuidedTour, [kmGuidedTour]',
})
export class GuidedTourDirective implements AfterViewInit, OnDestroy {
  @Input('kmGuidedTour') name: string;
  @Output() prev?: EventEmitter<any> = new EventEmitter<any>();
  @Output() next?: EventEmitter<any> = new EventEmitter<any>();
  @Output() done?: EventEmitter<any> = new EventEmitter<any>();

  guidedTourItem: GuidedTourItem;

  private _windowRef: Window;
  private _step: GuidedTourStep;
  private readonly _unsubscribe = new Subject<void>();

  constructor(
    private readonly _guidedTourStepsContainer: GuidedTourStepsContainerService,
    private readonly _guidedTourItemsService: GuidedTourItemsService,
    private readonly _viewContainerRef: ViewContainerRef,
    private readonly _router: Router
  ) {
    this._windowRef = window;
    this._step = new GuidedTourStep();
  }

  ngAfterViewInit(): void {
    this.guidedTourItem = this._guidedTourItemsService.getGuidedTourItems().find(item => item.id === this.name);

    this._step.title = this.guidedTourItem.title;
    this._step.text = this.guidedTourItem.text;
    this._step.position = this.guidedTourItem.stepPosition;
    if (this.guidedTourItem.nextText) {
      this._step.nextText = this.guidedTourItem.nextText;
    }
    this._step.route = this.guidedTourItem.route;
    this._step.targetViewContainer = this._viewContainerRef;
    this._step.nextClicked = this.next;
    this._step.prevCliked = this.prev;
    this._step.tourDone = this.done;
    this._step.name = this.name;
    this._step.route = this._router.url.substr(0, 1) === '/' ? this._router.url.substr(1) : this._router.url;
    this._step.isElementOrAncestorFixed =
      this._isElementFixed(this._viewContainerRef.element) ||
      this._isAncestorsFixed(this._viewContainerRef.element.nativeElement.parentElement);

    this._guidedTourStepsContainer.addStep(this._step);
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _isElementFixed(element: ElementRef): boolean {
    return this._windowRef.getComputedStyle(element.nativeElement).position === 'fixed';
  }

  private _isAncestorsFixed(nativeElement: any): boolean {
    if (!nativeElement || !nativeElement.parentElement) {
      return false;
    }

    const _isElementFixed = this._windowRef.getComputedStyle(nativeElement.parentElement).position === 'fixed';
    if (nativeElement.nodeName === 'BODY') {
      return _isElementFixed;
    }

    if (_isElementFixed) {
      return true;
    }

    return this._isAncestorsFixed(nativeElement.parentElement);
  }
}
