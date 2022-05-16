import {AfterViewInit, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Subject} from 'rxjs';
import {Terminal} from 'xterm';
import {FitAddon} from 'xterm-addon-fit';
import {Cluster} from '@shared/entity/cluster';
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

  @Input() cluster: Cluster;
  @Output() closeTerminal = new EventEmitter<boolean>();

  @ViewChild('terminal', {static: true}) terminalRef: ElementRef;

  private readonly _unsubscribe = new Subject<void>();

  constructor(private readonly _activatedRoute: ActivatedRoute, private readonly websocketService: WebsocketService) {}

  ngOnInit(): void {
    this.initSubscriptions();
    this.initTerminal();
  }

  initSubscriptions() {
    this.projectId = this._activatedRoute.snapshot.paramMap.get(PathParam.ProjectID);
    this.clusterId = this._activatedRoute.snapshot.paramMap.get(PathParam.ClusterID);

    this.websocketService.messages$.subscribe((data: ITerminalFrame) => {
      this.handleWebSocketConnectionMessages(data);
    });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
    this.websocketService.close();
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
      convertEol: true,
      rendererType: 'dom',
      theme: {
        foreground: '#a7aaac',
        background: '#2b3035'
      }
    });

    const containerElement = this.terminalRef.nativeElement;
    this.terminal.open(containerElement);

    const clusterName = this.cluster && this.cluster.name;
    this.terminal.write('\x1b[37mWEB TERMINAL\x1b\r\n\n');
    this.terminal.write('\x1b[37mWelcome to Cloud Shell! Type "help" to get started.\r\n\n');
    this.terminal.write(`\x1b[37mYour Cloud Platform project in this session is set to ${clusterName}.\n\n\r`);

    const fitAddon = new FitAddon();
    this.terminal.loadAddon(fitAddon);
    fitAddon.fit();

    // Event listeners binding
    this.terminal.onData(this.onTerminalSendString.bind(this));
  }

  onClose($event: boolean) {
    this.closeTerminal.emit($event);
  }

  private handleWebSocketConnectionMessages(frame: ITerminalFrame): void {
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
