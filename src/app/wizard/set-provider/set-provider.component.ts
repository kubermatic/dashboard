import { Observable } from 'rxjs/Rx';
import { select } from '@angular-redux/store';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import { NodeProvider } from "../../shared/model/NodeProviderConstants";

@Component({
  selector: 'kubermatic-set-provider',
  templateUrl: 'set-provider.component.html',
  styleUrls: ['set-provider.component.scss']
})
export class SetProviderComponent implements OnInit {

  public setProviderForm: FormGroup;
  public supportedNodeProviders: string[] = NodeProvider.Supported;

  @select(['wizard', 'setProviderForm', 'provider']) provider$: Observable<string>;
  public selectedProvider: string;

  constructor(private fb: FormBuilder) { }

  ngOnInit() {
    this.provider$.subscribe(provider => {
      provider && (this.selectedProvider = provider);
    });

    this.setProviderForm = this.fb.group({
      provider: ['']
    });
  }
}
