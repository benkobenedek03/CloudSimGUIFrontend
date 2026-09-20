import { CloudletDTO } from "./cloudlet-dto";
import { DatacenterDTO } from "./datacenter-dto";
import { VmDTO } from "./vm-dto";

export interface DetailedRequestDto {
    datacenters: DatacenterDTO[];
    vms: VmDTO[];
    cloudlets: CloudletDTO[];
}
