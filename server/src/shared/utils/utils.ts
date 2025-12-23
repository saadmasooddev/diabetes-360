import { CustomerData } from "@shared/schema";
import { BadRequestError } from "../errors";

export const parseLocalDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
};

export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
};

export const formatUserInfo = (customerData: CustomerData) => {
  return {
    gender: customerData.gender,
    birthday: formatDate(customerData.birthday),
    diagnosisDate: formatDate(customerData.diagnosisDate),
    weight: `${customerData.weight}kg`,
    height: `${customerData.height}cm`,
    diabetesType: customerData.diabetesType,
  };
};

export const validateLimitAndOffset = (limit?: number, offset?: number) => {
  if (limit !== undefined && (isNaN(limit) || limit < 1 || limit > 100)) {
    throw new BadRequestError("limit must be between 1 and 100");
  }
  if (offset !== undefined && (isNaN(offset) || offset < 0)) {
    throw new BadRequestError("offset must be a non-negative integer");
  }
}