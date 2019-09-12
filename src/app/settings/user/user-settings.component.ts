import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup} from '@angular/forms';

@Component({
  selector: 'kubermatic-user-settings',
  templateUrl: 'user-settings.component.html',
  styleUrls: ['user-settings.component.scss'],
})
export class UserSettingsComponent implements OnInit {
  form: FormGroup;
  themes = ['default', 'dark', 'comic-sans'];
  itemsPerPage = 10;

  constructor(private readonly _builder: FormBuilder) {}

  ngOnInit(): void {
    this.form =
        this._builder.group({themes: this._builder.control('default'), itemsPerPage: this._builder.control(10)});
  }

  changeTheme(): void {}
}
