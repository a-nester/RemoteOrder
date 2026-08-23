import { Role } from "./Role";

export type User = {
  id: number;
  email: string;
  password?: string;
  role: Role;
  warehouseId?: string;
  visibleWarehouses?: string[];
  visibleTerritories?: string[];
  visiblePriceTypes?: string[];
  permissions?: any;
};
