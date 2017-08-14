export class OpenstackNodeSpec {
  flavor: string;
  image: string;

  constructor(flavor: string, image: string) {
    this.flavor = flavor;
    this.image = image;
  }
}
