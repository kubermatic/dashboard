export interface OpenstackFlavor {
  disk: number;
  isPublic: boolean;
  memory: number;
  region: string;
  slug: string;
  swap: number;
  vcpus: number;
}
