import startMockProvider from "./mock-provider.mjs";
const port = Number(process.argv[2] || 4321);
await startMockProvider(port, 10);
console.log("ready");
