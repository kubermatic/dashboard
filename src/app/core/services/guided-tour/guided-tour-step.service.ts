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
  Injectable,
  ElementRef,
  ComponentRef,
  ComponentFactoryResolver,
  ApplicationRef,
  Injector,
  EmbeddedViewRef,
} from '@angular/core';
import {Router} from '@angular/router';
import {ReplaySubject, Observable} from 'rxjs';

import {GuidedTourStep, GuidedTourStepInfo, StepActionType} from '../../../shared/entity/guided-tour';
import {EventListenerService} from './event-listener.service';
import {GuidedTourStepsContainerService} from './guided-tour-steps-container.service';
import {GuidedTourOptionsService} from './guided-tour-options.service';
import {GuidedTourStepComponent} from '../../../shared/components/guided-tour/step/step.component';

@Injectable()
export class GuidedTourStepService {
  private _currentStep: GuidedTourStep;
  private _winTopPosition = 0;
  private _winBottomPosition = 0;
  private _stepsObserver: ReplaySubject<GuidedTourStepInfo> = new ReplaySubject<GuidedTourStepInfo>();
  private _documentHeight: number;
  private refMap: {[key: string]: ComponentRef<GuidedTourStepComponent>} = {};
  private readonly _scrollbarSize = 20;
  private readonly _distanceFromTarget = 15;
  private readonly _arrowSize = 10;

  constructor(
    private readonly _eventListener: EventListenerService,
    private readonly _guidedTourStepsContainerService: GuidedTourStepsContainerService,
    private readonly _guidedTourOptionsService: GuidedTourOptionsService,
    private readonly _router: Router,
    private readonly _componentFactoryResolver: ComponentFactoryResolver,
    private _appRef: ApplicationRef,
    private _injector: Injector
  ) {
    this._setDocumentHeight();
    this._initViewportPositions();
    this._subscribeToScrollEvents();
  }

  startTour(): Observable<GuidedTourStepInfo> {
    this._stepsObserver = new ReplaySubject<GuidedTourStepInfo>();
    this._guidedTourStepsContainerService.init();
    this._setDocumentHeight();

    this._tryShowStep(StepActionType.NEXT);
    this._eventListener.startListeningResizeEvents();
    this._subscribeToStepsUpdates();
    return this._stepsObserver.asObservable();
  }

  close(): void {
    this._removeCurrentStep();
    this._notifyTourIsFinished();
    window.scrollTo(0, 0);
    this._eventListener.stopListeningResizeEvents();
  }

  prev(): void {
    this._removeCurrentStep();
    this._currentStep.prevCliked.emit();
    this._tryShowStep(StepActionType.PREV);
  }

  next(): void {
    this._removeCurrentStep();
    this._currentStep.nextClicked.emit();
    this._tryShowStep(StepActionType.NEXT);
  }

  getDocumentHeight(): number {
    return this._documentHeight;
  }

  getElementFixedTop(elementRef: ElementRef): number {
    return elementRef.nativeElement.getBoundingClientRect().top;
  }

  getElementFixedLeft(elementRef: ElementRef): number {
    return elementRef.nativeElement.getBoundingClientRect().left;
  }

  getElementAbsoluteTop(elementRef: ElementRef): number {
    const scrollOffsets = this._getScrollOffsets();
    return elementRef.nativeElement.getBoundingClientRect().top + scrollOffsets.y;
  }

  getElementAbsoluteLeft(elementRef: ElementRef): number {
    const scrollOffsets = this._getScrollOffsets();
    return elementRef.nativeElement.getBoundingClientRect().left + scrollOffsets.x;
  }

  private _initViewportPositions(): void {
    this._winTopPosition = 0;
    this._winBottomPosition = window.innerHeight - this._scrollbarSize;
  }

  private _subscribeToScrollEvents(): void {
    this._eventListener.startListeningScrollEvents();
    this._eventListener.scrollEvent.subscribe(scroll => {
      this._winTopPosition = scroll.scrollY;
      this._winBottomPosition = this._winTopPosition + window.innerHeight - this._scrollbarSize;
    });
  }

  private _drawStep(step: GuidedTourStep): void {
    step.position =
      step.position === 'NO_POSITION' ? this._guidedTourOptionsService.getStepDefaultPosition() : step.position;

    const ref: ComponentRef<GuidedTourStepComponent> = this._componentFactoryResolver
      .resolveComponentFactory(GuidedTourStepComponent)
      .create(this._injector);

    this._appRef.attachView(ref.hostView);
    const domElem = (ref.hostView as EmbeddedViewRef<any>).rootNodes[0] as HTMLElement;
    document.body.appendChild(domElem);

    const instance: GuidedTourStepComponent = ref.instance;
    instance.step = step;
    ref.changeDetectorRef.detectChanges();
    step.stepInstance = instance;

    this.refMap[step.name] = ref;
  }

  private _subscribeToStepsUpdates(): void {
    this._guidedTourStepsContainerService.stepHasBeenModified.subscribe(updatedStep => {
      if (this._currentStep && this._currentStep.name === updatedStep.name) {
        this._currentStep = updatedStep;
      }
    });
  }

  private _tryShowStep(actionType: StepActionType): void {
    const stepRoute = this._guidedTourStepsContainerService.getStepRoute(actionType);
    if (stepRoute) {
      this._router.navigate([stepRoute]);
    }

    const timeout = this._guidedTourOptionsService.getWaitingTime();
    setTimeout(() => {
      try {
        this._showStep(actionType);
      } catch (error) {
        this.close();
      }
    }, timeout);
  }

  private _showStep(actionType: StepActionType): void {
    this._currentStep = this._guidedTourStepsContainerService.getStep(actionType);

    // Scroll the element to get it visible if it's in a scrollable element
    this._scrollIfElementBeyondOtherElements();
    this._drawStep(this._currentStep);
    this._scrollWhenTargetOrStepAreHiddenBottom();
    this._scrollWhenTargetOrStepAreHiddenTop();
    this._notifyStepClicked(actionType);
  }

  private _notifyStepClicked(actionType: StepActionType): void {
    const stepInfo: GuidedTourStepInfo = {
      number: this._guidedTourStepsContainerService.getStepNumber(this._currentStep.name),
      name: this._currentStep.name,
      route: this._currentStep.route,
      actionType,
    };
    this._stepsObserver.next(stepInfo);
  }

  private _notifyTourIsFinished(): void {
    if (this._currentStep) {
      this._currentStep.tourDone.emit();
    }
    this._stepsObserver.complete();
  }

  private _removeCurrentStep(): void {
    if (this._currentStep) {
      this._appRef.detachView(this.refMap[this._currentStep.name].hostView);
      this.refMap[this._currentStep.name].destroy();
    }
  }

  private _scrollWhenTargetOrStepAreHiddenBottom(): void {
    const totalTargetBottom = this._getMaxTargetAndStepBottomPosition();
    if (totalTargetBottom > this._winBottomPosition) {
      window.scrollBy(0, totalTargetBottom - this._winBottomPosition);
    }
  }

  private _scrollWhenTargetOrStepAreHiddenTop(): void {
    const totalTargetTop = this._getMaxTargetAndStepTopPosition();
    if (totalTargetTop < this._winTopPosition) {
      window.scrollBy(0, totalTargetTop - this._winTopPosition);
    }
  }

  private _getMaxTargetAndStepBottomPosition(): number {
    const divider = 2;
    const targetAbsoluteTop = this.getElementAbsoluteTop(this._currentStep.targetViewContainer.element);
    if (this._currentStep.position === 'top') {
      return targetAbsoluteTop + this._currentStep.stepInstance.targetHeight;
    } else if (this._currentStep.position === 'bottom') {
      return (
        targetAbsoluteTop +
        this._currentStep.stepInstance.targetHeight +
        this._currentStep.stepInstance.stepHeight +
        this._arrowSize +
        this._distanceFromTarget
      );
    } else if (this._currentStep.position === 'right' || this._currentStep.position === 'left') {
      return Math.max(
        targetAbsoluteTop + this._currentStep.stepInstance.targetHeight,
        targetAbsoluteTop +
          this._currentStep.stepInstance.targetHeight / divider +
          this._currentStep.stepInstance.stepHeight / divider
      );
    }
  }

  private _getMaxTargetAndStepTopPosition(): number {
    const divider = 2;
    const targetAbsoluteTop = this.getElementAbsoluteTop(this._currentStep.targetViewContainer.element);
    if (this._currentStep.position === 'top') {
      return (
        targetAbsoluteTop - (this._currentStep.stepInstance.stepHeight + this._arrowSize + this._distanceFromTarget)
      );
    } else if (this._currentStep.position === 'bottom') {
      return targetAbsoluteTop;
    } else if (this._currentStep.position === 'right' || this._currentStep.position === 'left') {
      return Math.min(
        targetAbsoluteTop,
        targetAbsoluteTop +
          this._currentStep.stepInstance.targetHeight / divider -
          this._currentStep.stepInstance.stepHeight / divider
      );
    }
  }

  private _scrollIfElementBeyondOtherElements(): void {
    if (
      !!this._isElementBeyondOthers(
        this._currentStep.targetViewContainer.element,
        this._currentStep.isElementOrAncestorFixed
      ) &&
      this._isParentScrollable(this._currentStep.targetViewContainer.element)
    ) {
      this._scrollIntoView(this._currentStep.targetViewContainer.element, this._currentStep.isElementOrAncestorFixed);
      this._currentStep.targetViewContainer.element.nativeElement.scrollIntoView();
    }
  }

  private _isElementBeyondOthers(elementRef: ElementRef, isElementFixed: boolean): boolean {
    const x1 = isElementFixed ? this.getElementFixedLeft(elementRef) : this.getElementAbsoluteLeft(elementRef);
    const y1 = isElementFixed ? this.getElementFixedTop(elementRef) : this.getElementAbsoluteTop(elementRef);
    const x2 = x1 + elementRef.nativeElement.getBoundingClientRect().width - 1;
    const y2 = y1 + elementRef.nativeElement.getBoundingClientRect().height - 1;

    const elements1 = document.elementsFromPoint(x1, y1);
    const elements2 = document.elementsFromPoint(x2, y2);

    return elements1.length === 0 && elements2.length === 0;
  }

  private _setDocumentHeight(): void {
    const documentRef = document;
    this._documentHeight = Math.max(
      documentRef.body.scrollHeight,
      documentRef.documentElement.scrollHeight,
      documentRef.body.offsetHeight,
      documentRef.documentElement.offsetHeight,
      documentRef.body.clientHeight,
      documentRef.documentElement.clientHeight
    );
  }

  private _isParentScrollable(elementRef: ElementRef): boolean {
    return this._getFirstScrollableParent(elementRef.nativeElement) !== document.body;
  }

  private _scrollIntoView(elementRef: ElementRef, isElementFixed: boolean): void {
    const scrollSize = 150;
    const firstScrollableParent = this._getFirstScrollableParent(elementRef.nativeElement);
    const top = isElementFixed ? this.getElementFixedTop(elementRef) : this.getElementAbsoluteTop(elementRef);
    if (firstScrollableParent !== document.body) {
      if (firstScrollableParent.scrollTo) {
        firstScrollableParent.scrollTo(0, top - scrollSize);
      }
    } else {
      window.scrollTo(0, top - scrollSize);
    }
  }

  private _getFirstScrollableParent(node: any) {
    const regex = /(auto|scroll|overlay)/;
    const style = (node: any, prop: any) => window.getComputedStyle(node, null).getPropertyValue(prop);
    const scroll = (node: any) =>
      regex.test(style(node, 'overflow') + style(node, 'overflow-y') + style(node, 'overflow-x'));
    const scrollparent = (node: any): any => {
      return !node || node === document.body ? document.body : scroll(node) ? node : scrollparent(node.parentNode);
    };

    return scrollparent(node);
  }

  private _getScrollOffsets(): {x: number; y: number} {
    const winReference = window;

    if (winReference.pageXOffset !== null) {
      return {x: winReference.pageXOffset, y: winReference.pageYOffset};
    }
  }
}
