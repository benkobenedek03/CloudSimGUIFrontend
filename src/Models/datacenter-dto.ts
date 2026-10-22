import { HostDTO } from "./host-dto";

export interface DatacenterDTO {
    name: string;
    costPerSec: number;
    costPerMem: number;
    costPerStorage: number;
    costPerBw: number;
    hosts: HostDTO[];
}
