import test from "node:test";
import assert from "node:assert/strict";

import { createHostedDemoServer } from "../scripts/serve-hosted-demo.mjs";

test("serves the local hosted-demo candidate without external network", async () => {
  const server = createHostedDemoServer();

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/`);
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(html, /WorkProof Payment Gate/);
    assert.match(html, /No proof, no pay/);
    assert.match(html, /ALLOW_DRY_RUN/);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
