import { async, ComponentFixture, TestBed } from "@angular/core/testing";
import {FormBuilder, ReactiveFormsModule, FormsModule} from "@angular/forms";
import {ApiService} from "app/core/services/api/api.service";
import {HttpModule} from "@angular/http";
import {Auth} from "../core/services";
import {RouterTestingModule} from "@angular/router/testing";
import {StoreModule} from "@ngrx/store";
import {combinedReducer} from "../redux/reducers/index";
import { MaterialModule } from '@angular/material';
import { SshkeyComponent } from "./sshkey.component";
import { ListSshKeyComponent } from './list-ssh-key/list-ssh-key.component';
import { AddSshKeyComponent } from './add-ssh-key/add-ssh-key.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';


describe("SshkeyComponent", () => {
  let component: SshkeyComponent;
  let fixture: ComponentFixture<SshkeyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        FormsModule,
        ReactiveFormsModule,
        HttpModule,
        RouterTestingModule,
        StoreModule.provideStore(combinedReducer),
        MaterialModule
      ],
      declarations: [
        SshkeyComponent,
        ListSshKeyComponent,
        AddSshKeyComponent
      ],
      providers: [
        Auth,
        ApiService,
        FormBuilder,
      ],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SshkeyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
