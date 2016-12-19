import {KeyCert} from '../KeyCert';

export class BringYourOwnCloudSpec {
  privateInterface: string;
  clientKeyCert: KeyCert;

  constructor(privateInterface: string, clientKeyCert: KeyCert) {
    this.privateInterface = privateInterface;
    this.clientKeyCert = clientKeyCert;
  }
}
