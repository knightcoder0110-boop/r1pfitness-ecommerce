export type {
  CatalogDataSource,
  ListProductsQuery,
  ListProductsResult,
} from "./types";
export { createFixtureCatalog } from "./fixture-adapter";
export { createWooCatalog } from "./woo-adapter";
export { getCatalog, __resetCatalogForTests } from "./source";
