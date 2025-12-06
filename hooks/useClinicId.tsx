// src/hooks/useClinicId.ts
import { useClinic } from '../context/ClinicContext';

export const useClinicId = (): string | null => {
  const { currentClinic } = useClinic();
  return currentClinic?.id || currentClinic?._id || null;
};