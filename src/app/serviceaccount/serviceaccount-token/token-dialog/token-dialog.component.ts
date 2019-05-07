import {Component, Input} from '@angular/core';
import {ProjectService} from '../../../core/services';
import {ServiceAccountTokenEntity} from '../../../shared/entity/ServiceAccountEntity';

@Component({
  selector: 'kubermatic-token-dialog',
  templateUrl: './token-dialog.component.html',
  styleUrls: ['./token-dialog.component.scss'],
})

export class TokenDialogComponent {
  @Input() serviceaccountToken: ServiceAccountTokenEntity;

  constructor(private readonly _projectService: ProjectService) {}

  downloadToken(): void {
    const blob = new Blob([this.serviceaccountToken.token], {type: 'text/plain'});
    const a = window.document.createElement('a');
    a.href = window.URL.createObjectURL(blob);
    a.download =
        window.location.host + '-' + this._projectService.getCurrentProjectId() + '-' + this.serviceaccountToken.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}
