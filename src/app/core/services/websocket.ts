// Copyright 2022 The Kubermatic Kubernetes Platform contributors.
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

import {Injectable} from '@angular/core';
import {environment} from '@environments/environment';
import {ITerminalFrame} from '@shared/model/Terminal';
import {EMPTY, Observable, Subject, throwError} from 'rxjs';
import {catchError, switchAll, tap} from 'rxjs/operators';
import {webSocket, WebSocketSubject} from 'rxjs/webSocket';

@Injectable({
  providedIn: 'root',
})
export class WebsocketService {
  private readonly _wsRoot = environment.wsRoot;
  private _socket$: WebSocketSubject<ITerminalFrame>;
  private _connectSubject$ = new Subject<void>();
  private _closeSubject$ = new Subject<void>();
  private _messagesSubject$ = new Subject();

  messages$ = this._messagesSubject$.pipe(
    switchAll(),
    catchError(e => {
      throw e;
    })
  );

  private get _isSocketClosed(): boolean {
    return !this._socket$ || this._socket$.closed;
  }

  connect(path: string): void {
    if (this._isSocketClosed) {
      const url = `${this._wsRoot}/${path}`;
      this._socket$ = this._getNewWebSocket(url);
      const messages = this._socket$.pipe(
        tap({
          error: error => throwError(error),
        }),
        catchError(_ => EMPTY)
      );

      this._messagesSubject$.next(messages);
    }
  }

  sendMessage(payload: ITerminalFrame): void {
    if (this._isSocketClosed) {
      return;
    }
    this._socket$.next(payload);
  }

  close(): void {
    if (this._isSocketClosed) {
      return;
    }
    this._socket$.complete();
    this._socket$ = null;
  }

  getWebSocketOnConnectObservable$(): Observable<void> {
    return this._connectSubject$.asObservable();
  }

  getWebSocketOnCloseObservable$(): Observable<void> {
    return this._closeSubject$.asObservable();
  }

  private _getNewWebSocket(urlConfigOrSource: string): WebSocketSubject<ITerminalFrame> {
    return webSocket({
      url: urlConfigOrSource,
      openObserver: {
        next: _ => this._connectSubject$.next(),
      },
      closeObserver: {
        next: () => {
          this._closeSubject$.next();
          this.close();
        },
      },
    });
  }
}
