import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'kubermatic-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss']
})
export class ModalComponent implements OnInit {
  @Input() headline: string;
  @Input() submitLabel: string;

  constructor() {
  }

  ngOnInit() {
    if(!this.submitLabel.length) {
      this.submitLabel = 'Save';
    }

  }

}
