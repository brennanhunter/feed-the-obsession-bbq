import { SquareClient, SquareEnvironment } from "square";

// Server-only Square client. The access token can move money — never expose it.
export const square = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN!,
  environment:
    process.env.SQUARE_ENVIRONMENT === "production"
      ? SquareEnvironment.Production
      : SquareEnvironment.Sandbox,
});

export const LOCATION_ID = process.env.SQUARE_LOCATION_ID!;
