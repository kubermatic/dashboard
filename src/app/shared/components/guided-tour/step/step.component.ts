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
  Component,
  Input,
  AfterViewInit,
  ViewEncapsulation,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  Renderer2,
  Output,
  EventEmitter,
} from '@angular/core';
import {Subscription, Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {GuidedTourStep} from '../../../entity/guided-tour';
import {GuidedTourStepService} from '../../../../core/services/guided-tour/guided-tour-step.service';
import {GuidedTourStepsContainerService} from '../../../../core/services/guided-tour/guided-tour-steps-container.service';
import {EventListenerService} from '../../../../core/services/guided-tour/event-listener.service';
import {GuidedTourOptionsService} from '../../../../core/services/guided-tour/guided-tour-options.service';

@Component({
  selector: 'guided-tour-step',
  templateUrl: './step.component.html',
  styleUrls: ['./step.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class GuidedTourStepComponent implements OnInit, OnDestroy, AfterViewInit {
  private readonly _distanceFromTarget = 15;
  private readonly _arrowSize = 10;
  private readonly _stepMinWidth = 350;
  private readonly _stepMaxWidth = 400;
  private readonly _stepHeight = 100;
  private readonly _aspectRatio = 2;
  private readonly _defaultDistanceFromMarginTop = 2;
  private readonly _defaultDistanceFromMarginLeft = 2;
  private readonly _defaultDistanceFromMarginBottom = 5;
  private readonly _defaultDistanceFromMarginRight = 5;
  private readonly _unsubscribe = new Subject<void>();

  private _stepAbsoluteLeft: number;
  private _stepAbsoluteTop: number;
  private _targetWidth: number;
  private _targetAbsoluteLeft: number;
  private _targetAbsoluteTop: number;
  private _positionAlreadyFixed: boolean;
  private _documentHeight: number;

  stepWidth: number = this._stepMinWidth;
  stepHeight: number = this._stepHeight;
  leftPosition: number;
  topPosition: number;
  showArrow = true;
  arrowPosition: string;
  arrowLeftPosition: number;
  arrowTopPosition: number;
  title: string;
  text: string;
  nextText = 'Next';
  isPrevButtonVisible: boolean;
  ctx: Record<string, any>;
  targetHeight: number;

  @Input() step?: GuidedTourStep;
  @ViewChild('stepWrapper', {static: true}) stepWrapper: ElementRef;
  @ViewChild('stepContainer', {static: true}) stepContainer: ElementRef;
  @Output() clicked: EventEmitter<any> = new EventEmitter();

  constructor(
    private readonly _guidedTourStepsContainerService: GuidedTourStepsContainerService,
    private readonly _eventListenerService: EventListenerService,
    private readonly _renderer: Renderer2,
    private readonly _guidedTourOptionsService: GuidedTourOptionsService,
    private readonly _guidedTourStepService: GuidedTourStepService
  ) {}

  ngOnInit(): void {
    this._documentHeight = this._guidedTourStepService.getDocumentHeight();
    this._subscribeToResizeEvents();
    this.title = this.step.title;
    this.text = this.step.text;

    if (this.step.nextText) {
      this.nextText = this.step.nextText;
    }

    this.isPrevButtonVisible = this._guidedTourOptionsService.isPrevButtonVisible();

    if (this.text) {
      this._checkRedraw(this.text);
    }

    if (this.title) {
      this._checkRedraw(this.title);
    }
  }

  ngAfterViewInit(): void {
    this._renderer.setStyle(this.stepContainer.nativeElement, 'max-width', this._stepMaxWidth + 'px');
    let dimensions = this._getDimensionsByAspectRatio(
      this.stepContainer.nativeElement.clientWidth,
      this.stepContainer.nativeElement.clientHeight,
      this._aspectRatio
    );
    dimensions = this._adjustDimensions(dimensions.width, dimensions.height);
    this.stepWidth = dimensions.width;
    this.stepHeight = dimensions.height;
    this._renderer.setStyle(this.stepContainer.nativeElement, 'width', this.stepWidth + 'px');
    this._renderer.setStyle(this.stepContainer.nativeElement, 'height', this.stepHeight + 'px');

    this._drawStep();
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  prev(): void {
    this.clicked.emit();
    this._guidedTourStepService.prev();
  }

  next(): void {
    this.clicked.emit();
    this._guidedTourStepService.next();
  }

  close(): void {
    this.clicked.emit();
    this._guidedTourStepService.close();
  }

  isFirstStep(): boolean {
    return this._guidedTourStepsContainerService.getStepNumber(this.step.name) === 1;
  }

  isLastStep(): boolean {
    return (
      this._guidedTourStepsContainerService.getStepNumber(this.step.name) ===
      this._guidedTourStepsContainerService.getStepsCount()
    );
  }

  private _checkRedraw(val): void {
    const timeout = 2;
    if (val !== null) {
      // Need to wait that the change is rendered before redrawing
      setTimeout(() => {
        this._updateStepDimensions();
        this._drawStep();
      }, timeout);
    }
  }

  private _drawStep(): void {
    const position = this.step.isElementOrAncestorFixed ? 'fixed' : 'absolute';
    this._renderer.setStyle(this.stepWrapper.nativeElement, 'position', position);
    this._targetWidth = this.step.targetViewContainer.element.nativeElement.getBoundingClientRect().width;
    this.targetHeight = this.step.targetViewContainer.element.nativeElement.getBoundingClientRect().height;
    this._targetAbsoluteLeft =
      position === 'fixed'
        ? this._guidedTourStepService.getElementFixedLeft(this.step.targetViewContainer.element)
        : this._guidedTourStepService.getElementAbsoluteLeft(this.step.targetViewContainer.element);
    this._targetAbsoluteTop =
      position === 'fixed'
        ? this._guidedTourStepService.getElementFixedTop(this.step.targetViewContainer.element)
        : this._guidedTourStepService.getElementAbsoluteTop(this.step.targetViewContainer.element);
    this._setStepStyle();
  }

  private _setStepStyle(): void {
    switch (this.step.position) {
      case 'top': {
        this._setStyleTop();
        break;
      }
      case 'bottom': {
        this._setStyleBottom();
        break;
      }
      case 'right': {
        this._setStyleRight();
        break;
      }
      case 'left': {
        this._setStyleLeft();
        break;
      }
      case 'center': {
        this._setStyleCenter();
        break;
      }
      default: {
        this._setStyleBottom();
      }
    }
  }

  private _setStyleTop(): void {
    this._guidedTourStepsContainerService.updatePosition(this.step.name, 'top');
    this.topPosition = this._targetAbsoluteTop - this._distanceFromTarget - this.stepHeight;
    this._stepAbsoluteTop = this._targetAbsoluteTop - this._distanceFromTarget - this.stepHeight;
    this.arrowTopPosition = this.stepHeight;

    this.leftPosition =
      this._targetWidth / this._aspectRatio - this.stepWidth / this._aspectRatio + this._targetAbsoluteLeft;
    this._stepAbsoluteLeft =
      this._targetWidth / this._aspectRatio - this.stepWidth / this._aspectRatio + this._targetAbsoluteLeft;
    this.arrowLeftPosition = this.stepWidth / this._aspectRatio - this._arrowSize;
    this._adjustLeftPosition();
    this._adjustRightPosition();
    this.arrowPosition = 'bottom';
    this._autofixTopPosition();
  }

  private _setStyleRight(): void {
    this._guidedTourStepsContainerService.updatePosition(this.step.name, 'right');
    this.topPosition =
      this._targetAbsoluteTop + this.targetHeight / this._aspectRatio - this.stepHeight / this._aspectRatio;
    this._stepAbsoluteTop =
      this._targetAbsoluteTop + this.targetHeight / this._aspectRatio - this.stepHeight / this._aspectRatio;
    this.arrowTopPosition = this.stepHeight / this._aspectRatio - this._arrowSize;

    this.leftPosition = this._targetAbsoluteLeft + this._targetWidth + this._distanceFromTarget;
    this._stepAbsoluteLeft = this._targetAbsoluteLeft + this._targetWidth + this._distanceFromTarget;
    this.arrowLeftPosition = -this._arrowSize;
    this._adjustTopPosition();
    this._adjustBottomPosition();
    this.arrowPosition = 'left';
    this._autofixRightPosition();
  }

  private _setStyleBottom(): void {
    this._guidedTourStepsContainerService.updatePosition(this.step.name, 'bottom');
    this.topPosition = this._targetAbsoluteTop + this.targetHeight + this._distanceFromTarget;
    this._stepAbsoluteTop = this._targetAbsoluteTop + this.targetHeight + this._distanceFromTarget;
    this.arrowTopPosition = -this._arrowSize;

    this.arrowLeftPosition = this.stepWidth / this._aspectRatio - this._arrowSize;
    this.leftPosition =
      this._targetWidth / this._aspectRatio - this.stepWidth / this._aspectRatio + this._targetAbsoluteLeft;
    this._stepAbsoluteLeft =
      this._targetWidth / this._aspectRatio - this.stepWidth / this._aspectRatio + this._targetAbsoluteLeft;
    this._adjustLeftPosition();
    this._adjustRightPosition();
    this.arrowPosition = 'top';
    this._autofixBottomPosition();
  }

  private _setStyleLeft(): void {
    this._guidedTourStepsContainerService.updatePosition(this.step.name, 'left');
    this.topPosition =
      this._targetAbsoluteTop + this.targetHeight / this._aspectRatio - this.stepHeight / this._aspectRatio;
    this._stepAbsoluteTop =
      this._targetAbsoluteTop + this.targetHeight / this._aspectRatio - this.stepHeight / this._aspectRatio;
    this.arrowTopPosition = this.stepHeight / this._aspectRatio - this._arrowSize;

    this.leftPosition = this._targetAbsoluteLeft - this.stepWidth - this._distanceFromTarget;
    this._stepAbsoluteLeft = this._targetAbsoluteLeft - this.stepWidth - this._distanceFromTarget;
    this.arrowLeftPosition = this.stepWidth;
    this._adjustTopPosition();
    this._adjustBottomPosition();
    this.arrowPosition = 'right';
    this._autofixLeftPosition();
  }

  private _setStyleCenter(): void {
    this._renderer.setStyle(this.stepWrapper.nativeElement, 'position', 'fixed');
    this._renderer.setStyle(this.stepWrapper.nativeElement, 'top', '50%');
    this._renderer.setStyle(this.stepWrapper.nativeElement, 'left', '50%');

    this._updateStepDimensions();

    this._renderer.setStyle(
      this.stepWrapper.nativeElement,
      'transform',
      `translate(-${this.stepWidth / this._aspectRatio}px, -${this.stepHeight / this._aspectRatio}px)`
    );
    this.showArrow = false;
  }

  private _adjustLeftPosition(): void {
    if (this.leftPosition < 0) {
      this.arrowLeftPosition = this.arrowLeftPosition + this.leftPosition - this._defaultDistanceFromMarginLeft;
      this.leftPosition = this._defaultDistanceFromMarginLeft;
    }
  }

  private _adjustRightPosition(): void {
    const currentWindowWidth = document.body.clientWidth;
    if (this._stepAbsoluteLeft + this.stepWidth > currentWindowWidth) {
      const newLeftPos =
        this.leftPosition -
        (this._stepAbsoluteLeft + this.stepWidth + this._defaultDistanceFromMarginRight - currentWindowWidth);
      const deltaLeftPosition = newLeftPos - this.leftPosition;

      this.leftPosition = newLeftPos;
      this.arrowLeftPosition = this.arrowLeftPosition - deltaLeftPosition;
    }
  }

  private _adjustTopPosition(): void {
    if (this._stepAbsoluteTop < 0) {
      this.arrowTopPosition = this.arrowTopPosition + this.topPosition - this._defaultDistanceFromMarginTop;
      this.topPosition = this._defaultDistanceFromMarginTop;
    }
  }

  private _adjustBottomPosition(): void {
    if (this._stepAbsoluteTop + this.stepHeight > this._documentHeight) {
      const newTopPos =
        this.topPosition -
        (this._stepAbsoluteTop + this.stepHeight + this._defaultDistanceFromMarginBottom - this._documentHeight);
      const deltaTopPosition = newTopPos - this.topPosition;

      this.topPosition = newTopPos;
      this.arrowTopPosition = this.arrowTopPosition - deltaTopPosition;
    }
  }

  private _autofixTopPosition(): void {
    if (this._positionAlreadyFixed) {
      return;
    } else if (this._targetAbsoluteTop - this.stepHeight - this._arrowSize < 0) {
      this._positionAlreadyFixed = true;
      this._setStyleRight();
    }
  }

  private _autofixRightPosition(): void {
    if (this._targetAbsoluteLeft + this._targetWidth + this.stepWidth + this._arrowSize > document.body.clientWidth) {
      this._setStyleBottom();
    }
  }

  private _autofixBottomPosition(): void {
    if (this._targetAbsoluteTop + this.stepHeight + this._arrowSize + this.targetHeight > this._documentHeight) {
      this._setStyleLeft();
    }
  }

  private _autofixLeftPosition(): void {
    if (this._targetAbsoluteLeft - this.stepWidth - this._arrowSize < 0) {
      this._setStyleTop();
    }
  }

  private _subscribeToResizeEvents(): Subscription {
    return this._eventListenerService.resizeEvent.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
      this._updateStepDimensions();
      this._drawStep();
    });
  }

  private _getDimensionsByAspectRatio(
    width: number,
    height: number,
    aspectRatio: number
  ): {width: number; height: number} {
    const calcHeight = (width + height) / (1 + aspectRatio);
    const calcWidth = calcHeight * aspectRatio;
    return {
      width: calcWidth,
      height: calcHeight,
    };
  }

  private _adjustDimensions(width: number, height: number): {width: number; height: number} {
    const area = width * height;
    let newWidth = width;
    let newHeight = height;
    if (width > this._stepMaxWidth) {
      newWidth = this._stepMaxWidth;
      newHeight = area / newWidth;
    } else if (width < this._stepMinWidth) {
      newWidth = this._stepMinWidth;
      newHeight = this._stepMinWidth / this._aspectRatio;
    }
    return {width: newWidth, height: newHeight};
  }

  private _updateStepDimensions(): void {
    this.stepWidth = this.stepContainer.nativeElement.clientWidth;
    this.stepHeight = this.stepContainer.nativeElement.clientHeight;
  }
}
