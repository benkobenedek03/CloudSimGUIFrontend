export interface SimpleRequestDTO {
    datacenterCount?: number;
    hostCount?: number;
    vmCount?: number;
    cloudletCount?: number;
    hostMips?: number;
    hostPes?: number;
    hostRam?: number;
    vmMips?: number;
    vmPes?: number;
    vmRam?: number;
    cloudletLength?: number;
    cloudletPes?: number;
    schedulingPolicy?: 'TIME_SHARED' | 'SPACE_SHARED' | string;
}
