import {AfterViewInit, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Subject} from 'rxjs';
import {Terminal} from 'xterm';
import {FitAddon} from 'xterm-addon-fit';
import {WebsocketService} from '@core/services/websocket';
import {PathParam} from '@core/services/params';
import {ITerminalFrame} from '@shared/model/Terminal';

enum Operations {
  stdout = 'stdout',
  stdin = 'stdin',
  resize = 'resize',
  toast = 'toast',
}

@Component({
  selector: 'km-web-terminal',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class WebTerminalComponent implements OnInit, AfterViewInit {
  terminal: Terminal;
  projectId: string;
  clusterId: string;

  @ViewChild('terminal', {static: true}) terminalRef: ElementRef;
  private readonly unsubscribe_ = new Subject<void>();

  // private debouncedFit_: Function;

  constructor(private readonly _activatedRoute: ActivatedRoute, private readonly websocketService: WebsocketService) {}

  ngOnInit(): void {
    this.initTerminal();

    this.initSubscriptions();
  }

  initSubscriptions() {
    this.projectId = this._activatedRoute.snapshot.paramMap.get(PathParam.ProjectID);
    this.clusterId = this._activatedRoute.snapshot.paramMap.get(PathParam.ClusterID);

    this.websocketService.messages$.subscribe((data: ITerminalFrame) => {
      this.handleConnectionMessage(data);
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe_.next();
    this.unsubscribe_.complete();
  }

  ngAfterViewInit(): void {
    this.websocketService.connect(`projects/${this.projectId}/clusters/${this.clusterId}/terminal`);
  }

  initTerminal(): void {
    if (this.terminal) {
      this.terminal.dispose();
    }

    this.terminal = new Terminal({
      fontSize: 14,
      fontFamily: 'Consolas, "Courier New", monospace',
      cursorBlink: true,
    });

    const fitAddon = new FitAddon();
    this.terminal.loadAddon(fitAddon);
    const containerElement = this.terminalRef.nativeElement;
    this.terminal.open(containerElement);
    fitAddon.fit();

    // Event listeners binding
    this.terminal.onData(this.onTerminalSendString.bind(this));
  }

  private handleConnectionMessage(frame: ITerminalFrame): void {
    if (frame.Op === Operations.stdout) {
      this.terminal.write(frame.Data);
    }
  }

  private onTerminalSendString(str: string): void {
    this.websocketService.sendMessage({
      Op: Operations.stdin,
      Data: `${str}`,
      Cols: this.terminal.cols,
      Rows: this.terminal.rows,
    });
  }
}
