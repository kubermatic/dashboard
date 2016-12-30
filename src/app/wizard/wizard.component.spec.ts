/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { WizardComponent } from "./wizard.component";
import {FormBuilder} from "@angular/forms";
import {ClusterNameGenerator} from "../util/name-generator.service";
import {ApiService} from "../api/api.service";

describe("WizardComponent", () => {
  let component: WizardComponent;
  let fixture: ComponentFixture<WizardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        WizardComponent
      ],
      providers: [
        ApiService,
        ClusterNameGenerator,
        FormBuilder
      ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WizardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
