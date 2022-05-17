import {Component, ElementRef, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {Terminal} from 'xterm';
import {Cluster} from '@shared/entity/cluster';

@Component({
  selector: 'km-overlay-terminal',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class OverlayTerminalComponent {
  terminal: Terminal;
  projectId: string;
  clusterId: string;

  @Input() cluster: Cluster;
  @Output() openInNewTab = new EventEmitter<boolean>();
  @Output() closeTerminal = new EventEmitter<boolean>();
  @ViewChild('terminal', { static: true }) terminalRef: ElementRef;

  constructor() {}

  onCloseTerminal($event: boolean) {
    this.closeTerminal.emit($event);
  }

  onOpenInNewTab($event: boolean) {
    this.openInNewTab.emit($event);
  }
}
