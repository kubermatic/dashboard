/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { DashboardComponent } from "./dashboard.component";
import {WizardComponent} from "../wizard/wizard.component";
import {ReactiveFormsModule, FormsModule} from "@angular/forms";
import {HttpModule} from "@angular/http";
import {RouterTestingModule} from "@angular/router/testing";
import {Auth} from "../core/services";
import {ApiService} from "../api/api.service";
import {StoreModule} from "@ngrx/store";
import {combinedReducer} from "../reducers/index";
import {ClusterNameGenerator} from "../core/util/name-generator.service";
import {FrontpageComponent} from "../frontpage/frontpage.component";
import { MaterialModule } from '@angular/material';

describe("DashboardComponent", () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        FormsModule,
        ReactiveFormsModule,
        HttpModule,
        RouterTestingModule,
        StoreModule.provideStore(combinedReducer),
        MaterialModule
      ],
      declarations: [
        DashboardComponent,
        WizardComponent,
        FrontpageComponent
      ],
      providers: [
        Auth,
        ApiService,
        ClusterNameGenerator,
      ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
