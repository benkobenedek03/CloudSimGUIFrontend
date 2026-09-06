import { DetailedRequestDto } from "./detailed-request-dto";
import { SimpleRequestDTO } from "./simple-request";

export interface SimulationRequestDto {
    simpleRequest:SimpleRequestDTO | null
    detailedRequest:DetailedRequestDto | null
}
