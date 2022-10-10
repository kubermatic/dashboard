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
import {WebsocketService} from '@core/services/websocket';
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
  fontSize: 13,
  fontFamily: 'Consolas, "Courier New", monospace',
  cursorBlink: true,
  foreground: '#f8f8f8',
  background: '#2b3035',
};

enum Operations {
  stdout = 'stdout',
  stdin = 'stdin',
  msg = 'msg',
}

enum ErrorOperations {
  kubeconfigSecretMissing = 'KUBECONFIG_SECRET_MISSING',
  webTerminalPodPending = 'WEBTERMINAL_POD_PENDING',
  connectionPoolExceeded = 'CONNECTION_POOL_EXCEEDED',
}

@Component({
  selector: 'km-terminal',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class XTermTerminalComponent implements OnChanges, OnInit, OnDestroy, AfterViewInit {
  readonly DELAY_TIMEOUT = 100;
  readonly MAX_SESSION_SUPPORTED = 5;
  message = '';
  projectId: string;
  clusterId: string;
  cluster: Cluster;
  terminal: Terminal;
  isConnectionLost: boolean;
  isLoadingTerminal = true;
  isDexAuthenticationPageOpened = false;

  showCloseButtonOnToolbar;
  showOpenInSeparateViewButtonOnToolbar;
  showCloseButtonOnStatusToolbar;

  private _user: Member;
  private _initializeTerminalOnSuccess: Subject<boolean> = new Subject<boolean>();

  @Input() layout = LayoutType.page;

  @Output() close = new EventEmitter<void>();
  @ViewChild('terminal', {static: false}) terminalRef: ElementRef;
  @ViewChild('showTerminal', {static: true}) showTerminalRef: ElementRef;

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
    private readonly _websocketService: WebsocketService
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

    this._websocketService.messages$.pipe(takeUntil(this._unsubscribe)).subscribe((frame: ITerminalFrame) => {
      this._handleWebSocketConnectionMessages(frame);
    });

    this._websocketService
      .getWebSocketOnConnectObservable$()
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(() => {
        this.isConnectionLost = false;
      });

    this._websocketService
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
      this._cdr.detectChanges();
      this.initTerminal();
    });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
    this._websocketService.close();
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
      fontSize: Config.fontSize,
      fontFamily: Config.fontFamily,
      cursorBlink: Config.cursorBlink,
      theme: {
        foreground: Config.foreground,
        background: Config.background,
      },
    });

    const containerElement = this.terminalRef.nativeElement;
    const fitAddon = new FitAddon();
    this.terminal.loadAddon(fitAddon);
    this.terminal.open(containerElement);

    const clusterName = this.cluster && this.cluster.name;
    this.terminal.write('\x1b[37mWelcome to Cloud Shell! Type "help" to get started.\r\n');
    this.terminal.write(
      `\x1b[37mYour Cloud Platform project in this session is set to \x1b[1;34m${clusterName}\x1B[0m\n\n\r`
    );

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

    this.showCloseButtonOnStatusToolbar = true;
    this.showCloseButtonOnToolbar = true;
  }

  private _connectToWebSocketConnection(): void {
    this._websocketService.connect(this._getConnectionString());
  }

  private _getConnectionString(): string {
    return `projects/${this.projectId}/clusters/${this.clusterId}/terminal`;
  }

  private _handleWebSocketConnectionMessages(frame: ITerminalFrame): void {
    if (frame.Op === Operations.stdout) {
      // Initialize terminal on WS connection success.
      this._initializeTerminalOnSuccess.next(true);
      this._initializeTerminalOnSuccess.complete();
      this.terminal.write(frame.Data);
    } else if (frame.Op === Operations.msg) {
      if (frame.Data === ErrorOperations.kubeconfigSecretMissing) {
        if (!this.isDexAuthenticationPageOpened) {
          const url = this._getWebTerminalProxyURL();
          window.open(url, '_blank');
          this.isDexAuthenticationPageOpened = true;
        }

        this.message = 'Please wait, authenticate in order to access cloud shell...';
      } else if (frame.Data === ErrorOperations.webTerminalPodPending) {
        this.message = 'Please wait, provisioning your Cloud Shell machine...';
      } else if (frame.Data === ErrorOperations.connectionPoolExceeded) {
        this.terminal.write(
          `Oops! There could be ${this.MAX_SESSION_SUPPORTED} concurrent session per user either discard or close other sessions`
        );
      }
    }
  }

  private _removeEventListener(): void {
    if (this._resizeEventlistenerFn) {
      this._resizeEventlistenerFn();
    }
  }

  private _onTerminalSendString(str: string): void {
    this._websocketService.sendMessage({
      Op: Operations.stdin,
      Data: `${str}`,
      Cols: this.terminal.cols,
      Rows: this.terminal.rows,
    });
  }
}
