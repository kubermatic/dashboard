import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddSshKeyModalComponent } from './add-ssh-key-modal.component';

import {FormBuilder, ReactiveFormsModule, FormsModule} from '@angular/forms';
import {HttpModule} from '@angular/http';
import {RouterTestingModule} from '@angular/router/testing';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {Auth} from 'app/core/services';
import {ApiService} from 'app/core/services/api/api.service';

describe('AddSshKeyModalComponent', () => {
  let component: AddSshKeyModalComponent;
  let fixture: ComponentFixture<AddSshKeyModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        ReactiveFormsModule,
        FormsModule,
        HttpModule,
        RouterTestingModule
      ],
      declarations: [ AddSshKeyModalComponent ],
      providers: [
        FormBuilder,
        ApiService,
        Auth
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddSshKeyModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
