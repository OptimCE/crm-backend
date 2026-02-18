import { PaginationReceive } from "../../middlewares/pagination.middleware.js";
export {};
declare module "express-serve-static-core" {
  interface Request {
    pagination?: PaginationReceive;
  }
}
