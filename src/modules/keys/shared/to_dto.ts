import { AllocationKey, Consumer, Iteration } from "../domain/key.models.js";
import { ConsumerDTO, IterationDTO, KeyDTO, KeyPartialDTO } from "../api/key.dtos.js";

export function toKeyPartialDTO(key: AllocationKey): KeyPartialDTO {
  return {
    id: key.id,
    name: key.name,
    description: key.description,
  };
}
function toConsumerDTO(consumer: Consumer): ConsumerDTO {
  return {
    id: consumer.id,
    name: consumer.name,
    energy_allocated_percentage: consumer.energy_allocated_percentage,
  };
}
function toIterationDTO(iteration: Iteration): IterationDTO {
  return {
    id: iteration.id,
    number: iteration.number,
    energy_allocated_percentage: iteration.energy_allocated_percentage,
    consumers: iteration.consumers.map((consumer) => toConsumerDTO(consumer)),
  };
}
export function toKeyDTO(key: AllocationKey): KeyDTO {
  return {
    id: key.id,
    name: key.name,
    description: key.description,
    iterations: key.iterations.map((iteration) => toIterationDTO(iteration)),
  };
}
