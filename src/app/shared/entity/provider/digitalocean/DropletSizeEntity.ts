export class DigitaloceanSizes {
  standard: Standard[];
  optimized: Optimized[];

  static newDigitalOceanSizes(): DigitaloceanSizes {
    return {
      standard: [],
      optimized: [],
    };
  }
}

export class Standard {
  slug: string;
  available: boolean;
  transfer: number;
  price_monthly: number;
  price_hourly: number;
  memory: number;
  vcpus: number;
  disk: number;
  regions: string[];
}

export class Optimized {
  slug: string;
  available: boolean;
  transfer: number;
  price_monthly: number;
  price_hourly: number;
  memory: number;
  vcpus: number;
  disk: number;
  regions: string[];
}
