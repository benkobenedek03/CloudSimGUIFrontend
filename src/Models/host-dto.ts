export interface HostDTO {
    pes: number;
    mips: number;
    ram: number;
    storage: number;
    bw: number;
    vmScheduler: string;
    customSchedulerClass?: string;
}
