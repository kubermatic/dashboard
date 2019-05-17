export const AVAILABLE_PACKET_BILLING_CYCLES = ['hourly', 'daily'];

export class PacketCloudSpec {
  apiKey: string;
  projectID: string;
  billingCycle: string;
}
