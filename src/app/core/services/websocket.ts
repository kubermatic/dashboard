import {Injectable} from '@angular/core';
import {webSocket, WebSocketSubject} from 'rxjs/webSocket';
import {catchError, switchAll, tap} from 'rxjs/operators';
import {BehaviorSubject, EMPTY, Observable, Subject, throwError} from 'rxjs';
import {environment} from '@environments/environment';
import {ITerminalFrame} from '@shared/model/Terminal';

@Injectable({
  providedIn: 'root',
})
export class WebsocketService {
  private readonly _wsRoot = environment.wsRoot;

  private _socket$: WebSocketSubject<any>;
  private _onConnect: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private _onClose: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private _messagesSubject$ = new Subject();

  public messages$ = this._messagesSubject$.pipe(
    switchAll(),
    catchError(e => {
      throw e;
    })
  );

  public connect(path): void {
    if (!this._socket$ || this._socket$.closed) {
      const url = `${this._wsRoot}/${path}`;
      this._socket$ = this.getNewWebSocket(url);
      const messages = this._socket$.pipe(
        tap({
          error: error => throwError(error),
        }),
        catchError(_ => EMPTY)
      );

      this._messagesSubject$.next(messages);
    }
  }

  sendMessage(payload: ITerminalFrame) {
    this._socket$.next(payload);
  }

  close() {
    this._socket$.complete();
    this._socket$ = null;
  }

  getWebSocketOnConnectObservable$(): Observable<boolean> {
    return this._onConnect.asObservable();
  }

  // Todo: Will be used status toolbar for Reconnect functionality
  getWebSocketOnCloseObservable$(): Observable<boolean> {
    return this._onClose.asObservable();
  }


  private getNewWebSocket(url) {
    return webSocket({
      url: url,
      openObserver: {
        next: _ => {
          // eslint-disable-next-line no-console
          console.log('[WebSocketService]: connection ok');
          this._onConnect.next(true);
        },
      },
      closeObserver: {
        next: () => {
          // eslint-disable-next-line no-console
          console.log('[WebSocketService]: connection closed');
          this._onClose.next(true);
        },
      },
    });
  }
}
