import {Component, EventEmitter, OnInit, Output,} from '@angular/core';

@Component({
  selector: 'km-terminal-toolbar',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class TerminalToolBarComponent implements OnInit {
  @Output() closeTerminal = new EventEmitter<boolean>();
  @Output() openInNewTab = new EventEmitter<boolean>();

  constructor() {}

  ngOnInit(): void {}

  onCloseTerminal() {
    this.closeTerminal.emit(true);
  }

  onOpenInNewTab() {
    this.openInNewTab.next(true);
  }
}
