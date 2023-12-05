//                Kubermatic Enterprise Read-Only License
//                       Version 1.0 ("KERO-1.0”)
//                   Copyright © 2023 Kubermatic GmbH
//
// 1. You may only view, read and display for studying purposes the source
//    code of the software licensed under this license, and, to the extent
//    explicitly provided under this license, the binary code.
// 2. Any use of the software which exceeds the foregoing right, including,
//    without limitation, its execution, compilation, copying, modification
//    and distribution, is expressly prohibited.
// 3. THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND,
//    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
//    MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
//    IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
//    CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
//    TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
//    SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//
// END OF TERMS AND CONDITIONS

import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {ClusterBackup} from '@app/shared/entity/backup';

@Component({
  selector: 'km-delete-backup-dialog',
  templateUrl: './template.html',
})
export class DeleteBackupDialogComponent implements OnInit {
  verificationInput = '';
  backups: ClusterBackup[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) private readonly _config: DeleteBackupDialogComponent,
    private readonly _dialogRef: MatDialogRef<DeleteBackupDialogComponent>
  ) {}

  ngOnInit(): void {
    this.backups = this._config.backups;
  }

  onEnterKeyDown(): void {
    if (!this.isNameVerified()) {
      return;
    }
    this._dialogRef.close(true);
  }

  isNameVerified(): boolean {
    if (this.backups.length > 1) {
      return this.verificationInput === 'yes';
    }
    return this.verificationInput === this.backups[0]?.name;
  }
}
