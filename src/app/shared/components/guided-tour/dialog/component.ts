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
  Type,
  OnDestroy,
  AfterViewInit,
  ComponentFactoryResolver,
  ViewChild,
  ComponentRef,
  ChangeDetectorRef,
} from '@angular/core';
import {Subject} from 'rxjs';
import {InsertionDirective} from './directive';

@Component({
  selector: 'app-dialog',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class DialogComponent implements AfterViewInit, OnDestroy {
  private readonly _onClose = new Subject<any>();

  componentRef: ComponentRef<any>;
  childComponentType: Type<any>;
  onClose = this._onClose.asObservable();
  @ViewChild(InsertionDirective) insertionPoint: InsertionDirective;

  constructor(private _componentFactoryResolver: ComponentFactoryResolver, private _cd: ChangeDetectorRef) {}

  ngAfterViewInit(): void {
    this.loadChildComponent(this.childComponentType);
    this._cd.detectChanges();
  }

  ngOnDestroy(): void {
    if (this.componentRef) {
      this.componentRef.destroy();
    }
  }

  onOverlayClicked(evt: MouseEvent): void {
    evt.stopPropagation();
  }

  onDialogClicked(evt: MouseEvent): void {
    evt.stopPropagation();
  }

  loadChildComponent(componentType: Type<any>): void {
    const componentFactory = this._componentFactoryResolver.resolveComponentFactory(componentType);

    const viewContainerRef = this.insertionPoint.viewContainerRef;
    viewContainerRef.clear();

    this.componentRef = viewContainerRef.createComponent(componentFactory);
  }
}
