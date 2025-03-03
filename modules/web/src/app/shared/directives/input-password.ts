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

import {Directive, ElementRef, OnDestroy, OnInit} from '@angular/core';

@Directive({
  selector: '[kmInputPassword]',
  standalone: false,
})
export class InputPasswordDirective implements OnInit, OnDestroy {
  private _eventListener: EventListener;
  private readonly _input = this._el.nativeElement;
  private readonly _button = document.createElement('button');
  private readonly _icon = document.createElement('i');
  private _showPassword = false;

  constructor(private readonly _el: ElementRef) {
    this._eventListener = event => this.onClickEvent(event);
  }

  ngOnInit(): void {
    this.addButton();
  }

  ngOnDestroy(): void {
    this._button.removeEventListener('click', this._eventListener);
  }

  addButton() {
    this._input.type = 'password';
    this._button.classList.add('mat-icon-password-show-button', 'matSuffix');
    this._icon.classList.add('km-icon-mask', this._showPassword ? 'km-icon-show' : 'km-icon-hide');
    this._button.appendChild(this._icon);
    this._button.addEventListener('click', this._eventListener);
    const parentElement = this._input.parentNode;
    parentElement.parentNode.insertBefore(this._button, parentElement.nextSibling);
  }

  onClickEvent(event) {
    event.preventDefault();
    this._showPassword = !this._showPassword;
    this._input.type = this._showPassword ? 'text' : 'password';
    this._icon.className = '';
    this._icon.classList.add('km-icon-mask', this._showPassword ? 'km-icon-show' : 'km-icon-hide');
  }
}
