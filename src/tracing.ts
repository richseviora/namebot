import { config } from "dotenv";
import process from "process";
import { credentials, Metadata } from "@grpc/grpc-js";

import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { Resource } from "@opentelemetry/resources";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-grpc";

config();

const honeycombApiKey = process.env.HONEYCOMB_API_KEY;

function initializeTracing(apiKey: string): void {
  console.info("starting trace initialization");
  const metadata = new Metadata();
  metadata.set("x-honeycomb-team", apiKey);
  metadata.set("x-honeycomb-dataset", "receiver");
  const traceExporter = new OTLPTraceExporter({
    url: "grpc://api.honeycomb.io:443/",
    credentials: credentials.createSsl(),
    metadata,
  });

  const sdk = new NodeSDK({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: "receiver",
    }),
    traceExporter,
    instrumentations: [getNodeAutoInstrumentations()],
  });

  sdk
    .start()
    .then(() => console.log("Tracing initialized"))
    .catch((error) => console.log("Error initializing tracing", error));

  process.on("SIGTERM", () => {
    sdk
      .shutdown()
      .then(() => console.log("Tracing terminated"))
      .catch((error) => console.log("Error terminating tracing", error))
      .finally(() => process.exit(0));
  });
}

if (honeycombApiKey == null) {
  console.warn("No Honeycomb API Key attached");
} else {
  initializeTracing(honeycombApiKey);
}
