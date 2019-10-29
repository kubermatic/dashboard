import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {fadeInOut} from '../../shared/animations/fade';

@Component({
  selector: 'km-settings-status',
  templateUrl: './settings-status.component.html',
  styleUrls: ['./settings-status.component.scss'],
  animations: [fadeInOut],
})

export class SettingsStatusComponent implements OnChanges {
  @Input() isSaved = true;
  @Input() confirmationTimeout = 3000;
  isSaveConfirmationVisible = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.isSaved && !changes.isSaved.isFirstChange()) {
      this.isSaveConfirmationVisible = this.isSaved;
      setTimeout(() => this.isSaveConfirmationVisible = false, this.confirmationTimeout);
    }
  }
}
