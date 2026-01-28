import { User } from "../models/User";

export const USERS: User[] = [
  {
    id: 1,
    email: "admin@test.com",
    password: "123456",
    role: "admin",
  },
  {
    id: 2,
    email: "manager@test.com",
    password: "123456",
    role: "manager",
  },
  {
    id: 3,
    email: "client@test.com",
    password: "123456",
    role: "client",
  },
];
