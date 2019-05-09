import {Component, Input, OnInit} from '@angular/core';
import {MatDialogRef} from '@angular/material';
import {DomSanitizer, SafeUrl} from '@angular/platform-browser';

import {ProjectService} from '../../../core/services';
import {ServiceAccountTokenEntity} from '../../../shared/entity/ServiceAccountEntity';

@Component({
  selector: 'kubermatic-token-dialog',
  templateUrl: './token-dialog.component.html',
  styleUrls: ['./token-dialog.component.scss'],
})

export class TokenDialogComponent implements OnInit {
  @Input() serviceaccountToken: ServiceAccountTokenEntity;
  downloadUrl: SafeUrl;
  downloadTitle = '';

  constructor(
      public dialogRef: MatDialogRef<TokenDialogComponent>, private readonly _projectService: ProjectService,
      private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    const blob = new Blob([this.serviceaccountToken.token], {type: 'text/plain'});
    this.downloadUrl = this.sanitizer.bypassSecurityTrustUrl(window.URL.createObjectURL(blob));
    this.downloadTitle =
        window.location.host + '-' + this._projectService.getCurrentProjectId() + '-' + this.serviceaccountToken.name;
  }

  onNoClick(): void {
    this.dialogRef.close(false);
  }
}
