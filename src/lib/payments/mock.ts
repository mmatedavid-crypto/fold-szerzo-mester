import process from "node:process";

export function mockPaymentsEnabled(): boolean {
  return process.env.MOCK_PAYMENTS_ENABLED === "true" || process.env.NODE_ENV === "test";
}
