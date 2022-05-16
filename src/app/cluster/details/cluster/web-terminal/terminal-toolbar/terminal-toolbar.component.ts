import {Component, EventEmitter, OnInit, Output} from '@angular/core';

@Component({
  selector: 'km-terminal-toolbar',
  templateUrl: './terminal-toolbar.component.html',
  styleUrls: ['./terminal-toolbar.component.scss'],
})
export class TerminalToolbarComponent implements OnInit {
  @Output() close = new EventEmitter<boolean>();

  constructor() {}

  ngOnInit(): void {}

  onClose() {
    this.close.emit(true);
  }
}
