import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { MatDialogRef } from "@angular/material/dialog";
import { NotificationService } from "@app/core/services/notification";
import { SettingsService } from "@app/core/services/settings";
import { Admin } from "@app/shared/entity/member";
import { Observable } from "rxjs";

@Component({
  selector: 'km-add-global-viewer-dialog',
  templateUrl: './template.html',
  standalone: false,
})
export class AddGlobalViewerDialogComponenet implements OnInit {
  form: FormGroup;

  constructor(
    private readonly _settingsService: SettingsService,
    private readonly _matDialogRef: MatDialogRef<AddGlobalViewerDialogComponenet>,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.form = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email])
    })
  }

   getObservable(): Observable<Admin> {
      return this._settingsService.setAdmin({
        email: this.form.controls.email.value,
        isGlobalViewer: true,
      });
    }

    onNext(adminViewer: Admin): void {
      this._matDialogRef.close(adminViewer);
      this._notificationService.success(`Added the ${adminViewer.name} user to the global viewer group`);
    }
}
