/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as admin from "../admin.js";
import type * as corporateBilling from "../corporateBilling.js";
import type * as customers from "../customers.js";
import type * as giftBoxes from "../giftBoxes.js";
import type * as orders from "../orders.js";
import type * as products from "../products.js";
import type * as seed from "../seed.js";
import type * as testOperations from "../testOperations.js";
import type * as validateSchema from "../validateSchema.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  corporateBilling: typeof corporateBilling;
  customers: typeof customers;
  giftBoxes: typeof giftBoxes;
  orders: typeof orders;
  products: typeof products;
  seed: typeof seed;
  testOperations: typeof testOperations;
  validateSchema: typeof validateSchema;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
