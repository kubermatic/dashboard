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

import {Component, ElementRef, HostListener, OnDestroy} from '@angular/core';
import {Subject} from 'rxjs';

import {slideOut} from '../../../shared/animations/slide';
import {GuidedTourID} from '../../../shared/utils/guided-tour-utils/guided-tour-utils';
import {GuidedTourService} from '../../../core/services/guided-tour';
import {Auth} from '../../services';

@Component({
  selector: 'km-help-panel',
  templateUrl: './help-panel.component.html',
  styleUrls: ['./help-panel.component.scss'],
  animations: [slideOut],
})
export class HelpPanelComponent implements OnDestroy {
  readonly GuidedTourID = GuidedTourID;

  private _isOpen = false;
  private _unsubscribe: Subject<void> = new Subject();

  constructor(
    private readonly _elementRef: ElementRef,
    private readonly _auth: Auth,
    private readonly _guidedTourService: GuidedTourService
  ) {}

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  @HostListener('document:click', ['$event'])
  onOutsideClick(event: Event): void {
    if (!this._elementRef.nativeElement.contains(event.target) && this.isOpen()) {
      this.close();
    }
  }

  isOpen(): boolean {
    return this._isOpen;
  }

  close(): void {
    this._isOpen = false;
  }

  toggle(): void {
    this._isOpen = !this._isOpen;
  }

  goToGuidedTour(): void {
    this._guidedTourService.startTour();

    this._isOpen = false;
  }

  isAuthenticated(): boolean {
    return this._auth.authenticated();
  }
}
