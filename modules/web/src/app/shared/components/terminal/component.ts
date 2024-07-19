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

import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {ClusterService} from '@core/services/cluster';
import {PathParam} from '@core/services/params';
import {WebTerminalSocketService} from '@core/services/websocket';
import {Cluster} from '@shared/entity/cluster';
import {UserService} from '@core/services/user';
import {Member} from '@shared/entity/member';
import {ITerminalFrame, LayoutType, TerminalConfig} from '@shared/model/Terminal';
import {debounce} from 'lodash';
import {Subject} from 'rxjs';
import {take, takeUntil} from 'rxjs/operators';
import {Terminal} from 'xterm';
import {FitAddon} from 'xterm-addon-fit';

const Config: TerminalConfig = {
  FontSize: 13,
  FontFamily: 'Consolas, "Courier New", monospace',
  CursorBlink: true,
  Foreground: '#f8f8f8',
  Background: '#2b3035',
};

enum Operations {
  Stdout = 'stdout',
  Stdin = 'stdin',
  Msg = 'msg',
  Expiration = 'expiration',
  Refresh = 'refresh',
}

enum ErrorOperations {
  KubeConfigSecretMissing = 'KUBECONFIG_SECRET_MISSING',
  WebTerminalPodPending = 'WEBTERMINAL_POD_PENDING',
  ConnectionPoolExceeded = 'CONNECTION_POOL_EXCEEDED',
  RefreshesLimitExceeded = 'REFRESHES_LIMIT_EXCEEDED',
}

enum MessageTypes {
  Ping = 'PING',
  Pong = 'PONG',
}

@Component({
  selector: 'km-terminal',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class TerminalComponent implements OnChanges, OnInit, OnDestroy, AfterViewInit {
  readonly DELAY_TIMEOUT = 100;
  readonly MAX_SESSION_SUPPORTED = 5;
  readonly MAX_EXPIRATION_REFRESHES = 48; // maximum 24h for a pod lifetime of 30 minutes/session

  message = '';
  projectId: string;
  clusterId: string;
  cluster: Cluster;
  terminal: Terminal;
  isConnectionLost: boolean;
  isSessionExpiring: boolean;
  isLoadingTerminal = true;
  isDexAuthenticationPageOpened = false;
  showCloseButtonOnToolbar: boolean;
  showOpenInSeparateViewButtonOnToolbar: boolean;
  showCloseButtonOnStatusToolbar: boolean;

  @Input() layout = LayoutType.page;
  @Output() close = new EventEmitter<void>();
  @ViewChild('terminal', {static: false}) terminalRef: ElementRef;
  @ViewChild('terminalContainer', {static: true}) terminalContainerRef: ElementRef;

  private _user: Member;
  private _initializeTerminalOnSuccess: Subject<boolean> = new Subject<boolean>();
  private readonly _unsubscribe = new Subject<void>();
  private _resizeEventlistenerFn: () => void;

  constructor(
    private readonly _cdr: ChangeDetectorRef,
    private readonly _route: ActivatedRoute,
    private readonly _router: Router,
    private readonly _activatedRoute: ActivatedRoute,
    private readonly _clusterService: ClusterService,
    private readonly _renderer: Renderer2,
    private readonly _userService: UserService,
    private readonly _webTerminalSocketService: WebTerminalSocketService
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes.layout && changes.layout.currentValue) {
      this._updateTerminalButtonsVisibility();
    }
  }

  ngOnInit(): void {
    this.initSubscriptions();
  }

  initSubscriptions(): void {
    this._userService.currentUser.pipe(take(1)).subscribe(user => (this._user = user));

    this.projectId = this._activatedRoute.snapshot.paramMap.get(PathParam.ProjectID);
    this.clusterId = this._activatedRoute.snapshot.paramMap.get(PathParam.ClusterID);

    if (this.projectId && this.clusterId) {
      this._clusterService
        .cluster(this.projectId, this.clusterId)
        .pipe(takeUntil(this._unsubscribe))
        .subscribe((cluster: Cluster) => {
          this.cluster = cluster;
        });
    }

    this._webTerminalSocketService.messages$.pipe(takeUntil(this._unsubscribe)).subscribe((frame: ITerminalFrame) => {
      this._handleWebSocketConnectionMessages(frame);
    });

    this._webTerminalSocketService
      .getWebSocketOnConnectObservable$()
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(() => {
        this.isConnectionLost = false;
      });

    this._webTerminalSocketService
      .getWebSocketOnCloseObservable$()
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(() => {
        if (this.terminal) {
          this.terminal.options.cursorBlink = false;
        }
        this.isConnectionLost = true;
      });

    this._initializeTerminalOnSuccess.pipe(take(1)).subscribe(_ => {
      this.isLoadingTerminal = false;
      this._cdr.detectChanges(); // Update DOM to access terminal element
      this.initTerminal();
    });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
    this._webTerminalSocketService.close();
    // Clean 'resize' Event listener subscription
    this._removeEventListener();
  }

  ngAfterViewInit(): void {
    this._connectToWebSocketConnection();
  }

  initTerminal(): void {
    if (this.terminal) {
      this.terminal.dispose();
    }

    this.terminal = new Terminal({
      fontSize: Config.FontSize,
      fontFamily: Config.FontFamily,
      cursorBlink: Config.CursorBlink,
      theme: {
        foreground: Config.Foreground,
        background: Config.Background,
      },
    });

    const containerElement = this.terminalRef.nativeElement;
    const fitAddon = new FitAddon();
    this.terminal.loadAddon(fitAddon);
    this.terminal.open(containerElement);

    const clusterName = this.cluster && this.cluster.name;
    this._logToTerminal('\x1b[37mWelcome to Web Terminal! Type "help" to get started.\r\n');
    this._logToTerminal(`\x1b[37mYour KKP cluster in this session is set to \x1b[1;34m${clusterName}\x1B[0m\n\n\r`);

    const delayFn = debounce(() => {
      fitAddon.fit();
    }, this.DELAY_TIMEOUT);
    delayFn();

    this._removeEventListener();
    // Event listeners binding
    this._resizeEventlistenerFn = this._renderer.listen(window, 'resize', () => {
      delayFn();
    });

    // XTerminal Properties
    this.terminal.onData(this._onTerminalSendString.bind(this));
  }

  openInSeparateView(): void {
    this._router.navigate(['terminal'], {relativeTo: this._route});
  }

  onClose(): void {
    this.close.emit();
  }

  onReconnect(): void {
    // Re-initialize new terminal
    this.initTerminal();
    this._connectToWebSocketConnection();
  }

  onExtendSession(): void {
    this._onTerminalExtendSession();
    this.isSessionExpiring = false;
  }

  private _getWebTerminalProxyURL(): string {
    const userId = this._user?.id;
    return this._clusterService.getWebTerminalProxyURL(this.projectId, this.cluster.id, userId);
  }

  private _updateTerminalButtonsVisibility() {
    if (this.layout === LayoutType.page) {
      this.showOpenInSeparateViewButtonOnToolbar = false;
    } else if (this.layout === LayoutType.overlay) {
      this.showOpenInSeparateViewButtonOnToolbar = true;
    }

    this.showCloseButtonOnToolbar = true;
    this.showCloseButtonOnStatusToolbar = true;
  }

  private _connectToWebSocketConnection(): void {
    this._webTerminalSocketService.connect(this._getConnectionString());
  }

  private _getConnectionString(): string {
    return `projects/${this.projectId}/clusters/${this.clusterId}/terminal`;
  }

  private _handleWebSocketConnectionMessages(frame: ITerminalFrame): void {
    if (frame.Op === Operations.Stdout) {
      // Initialize terminal on WS connection success.
      this._initializeTerminalOnSuccess.next(true);
      this._initializeTerminalOnSuccess.complete();
      this._logToTerminal(frame.Data);
    } else if (frame.Op === Operations.Msg) {
      if (frame.Data === ErrorOperations.KubeConfigSecretMissing) {
        if (!this.isDexAuthenticationPageOpened) {
          const url = this._getWebTerminalProxyURL();
          window.open(url, '_blank');
          this.isDexAuthenticationPageOpened = true;
        }
        this.message = 'Please wait, authenticate in order to access web terminal...';
      } else if (frame.Data === ErrorOperations.WebTerminalPodPending) {
        this.message = 'Please wait, provisioning your Web Terminal pod...';
      } else if (frame.Data === ErrorOperations.ConnectionPoolExceeded) {
        const message = `Oops! There could be ${this.MAX_SESSION_SUPPORTED} concurrent session per user. Please either discard or close other sessions`;
        if (this.terminal) {
          this._logToTerminal(message);
        } else {
          this.message = message;
        }
      } else if (frame.Data === ErrorOperations.RefreshesLimitExceeded) {
        const clusterName = this.cluster && this.cluster.name;
        this._logToTerminal(
          `Oops! Max limit of ${this.MAX_EXPIRATION_REFRESHES} refreshes is reached. You are not allowed to extend the session for \x1b[1;34m${clusterName}\x1B[0m\n\n\r`
        );
      } else if (frame.Data === MessageTypes.Ping) {
        if (this.terminal) {
          // Note: Periodic exchange of messages with server to keep the web Terminal connection alive
          this._keepConnectionAlive(MessageTypes.Pong);
        }
      }
    } else if (frame.Op === Operations.Expiration) {
      this.isSessionExpiring = true;
    }
  }

  private _logToTerminal(message: string): void {
    if (this.terminal) {
      this.terminal.write(message);
    }
  }

  private _removeEventListener(): void {
    if (this._resizeEventlistenerFn) {
      this._resizeEventlistenerFn();
    }
  }

  private _onTerminalSendString(str: string): void {
    this._webTerminalSocketService.sendMessage({
      Op: Operations.Stdin,
      Data: `${str}`,
      Cols: this.terminal.cols,
      Rows: this.terminal.rows,
    });
  }

  private _keepConnectionAlive(str: string): void {
    this._webTerminalSocketService.sendMessage({
      Op: 'msg',
      Data: `${str}`,
    });
  }

  private _onTerminalExtendSession(): void {
    this._webTerminalSocketService.sendMessage({
      Op: Operations.Refresh,
    });
  }
}
