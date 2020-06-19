import {Component, Input, OnInit} from '@angular/core';
import {MatDialogRef} from '@angular/material/dialog';
import {DomSanitizer, SafeUrl} from '@angular/platform-browser';
import {ServiceAccountToken} from '../../../shared/entity/service-account';

@Component({
  selector: 'km-token-dialog',
  templateUrl: './token-dialog.component.html',
  styleUrls: ['./token-dialog.component.scss'],
})
export class TokenDialogComponent implements OnInit {
  @Input() serviceaccountToken: ServiceAccountToken;
  @Input() projectID: string;
  downloadUrl: SafeUrl;
  downloadTitle = '';

  constructor(public dialogRef: MatDialogRef<TokenDialogComponent>, private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    const blob = new Blob([this.serviceaccountToken.token], {
      type: 'text/plain',
    });
    this.downloadUrl = this.sanitizer.bypassSecurityTrustUrl(window.URL.createObjectURL(blob));
    this.downloadTitle = window.location.host + '-' + this.projectID + '-' + this.serviceaccountToken.name;
  }
}
