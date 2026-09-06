export interface CloudletExecutionResultDto {
  cloudletId: number;
  status: string;
  vmId: number;
  execTime: number;
  startTime: number;
  finishTime: number;
}

export interface ResultDto {
  jobId: string;
  totalExecutionTime: number;
  totalCpuCost: number;
  totalCloudlets: number;
  successfulCloudlets: number;
  cloudletResults: CloudletExecutionResultDto[];
}