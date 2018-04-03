
export interface DigitaloceanSize {
  slug: string;
  memory: number;
  vcpus: number;
  disk: number;
  transfer: number;
  price_monthly: number;
  price_hourly: number;
  regions: string[];
  available: boolean;
}

export interface Meta {
  total: number;
}


export interface DigitaloceanSizeResponseEntity {
  sizes: DigitaloceanSize[];

  meta: Meta;
}
