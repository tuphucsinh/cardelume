import "server-only";

// Production server boundary for checkout card document construction.
// Core document building and template constraints (e.g. input.managedTemplate?.photoMode==="required")
// are implemented in ./checkout-card-core.
export { buildCheckoutCardDocument } from "./checkout-card-core";
