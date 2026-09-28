import { BadRequestException } from '@nestjs/common';
import { Between, FindOperator } from 'typeorm';

export interface DateRangeOptions {
  maxDays?: number;
  startField?: string;
  endField?: string;
}

export function validateDateRange(
  fromInput?: string | Date,
  toInput?: string | Date,
  options?: DateRangeOptions,
): void {
  if (!fromInput || !toInput) return;

  const from = new Date(fromInput);
  const to = new Date(toInput);
  const startName = options?.startField || 'startDate';
  const endName = options?.endField || 'endDate';
  const maxDays = options?.maxDays ?? 365;

  if (isNaN(from.getTime()) || isNaN(to.getTime())) {
    throw new BadRequestException('Invalid date provided');
  }

  if (to < from) {
    throw new BadRequestException(`${endName} cannot be earlier than ${startName}`);
  }

  const diffDays = (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays > maxDays) {
    throw new BadRequestException(`Date range cannot exceed 1 year (${maxDays} days)`);
  }
}

export function resolveDateRange(
  payload?: { startDate?: string | Date; endDate?: string | Date },
  defaultYears: number = 1,
): { startDate: Date; endDate: Date; dateRange: FindOperator<Date> } {
  const endDate = payload?.endDate ? new Date(payload.endDate) : new Date();
  const startDate = payload?.startDate
    ? new Date(payload.startDate)
    : new Date(new Date(endDate).setFullYear(endDate.getFullYear() - defaultYears));

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    throw new BadRequestException('Invalid date provided');
  }

  if (startDate > endDate) {
    throw new BadRequestException('startDate cannot be greater than endDate');
  }

  return {
    startDate,
    endDate,
    dateRange: Between(startDate, endDate),
  };
}
