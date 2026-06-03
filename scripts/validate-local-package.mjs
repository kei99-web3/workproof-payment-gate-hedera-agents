import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

const baseRequiredFiles = [
  "README.md",
  "package.json",
  "src/policy-engine.mjs",
  "src/agent-kit-adapter.mjs",
  "src/workproof.mjs",
  "test/policy-engine.test.mjs",
  "hosted-demo/index.html"
];

const stagingDocs = [
  "docs/APPROVAL_GATES.md",
  "docs/LOCAL_VERIFICATION.md",
  "docs/SUBMISSION_CHECKLIST.md",
  "docs/DEMO_SCRIPT_90S.md",
  "docs/FEEDBACK_ISSUE_DRAFT.md",
  "docs/DEPENDENCY_AUDIT.md"
];

const requiredFiles = existsSync(path.join(root, "docs"))
  ? [...baseRequiredFiles, ...stagingDocs]
  : [...baseRequiredFiles, "DEPENDENCY_AUDIT.md"];

const requiredReadmeSnippets = [
  "No proof, no pay",
  "1.00 USDC",
  "Hedera Agent Kit",
  "no wallet",
  "no transaction"
];

const requiredDemoSnippets = [
  "WorkProof",
  "1.00 USDC",
  "No proof",
  "Dry-run",
  "no transaction"
];

function readRelative(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

const packageJson = JSON.parse(readRelative("package.json"));
const missingFiles = requiredFiles.filter((relativePath) => !existsSync(path.join(root, relativePath)));
const readme = existsSync(path.join(root, "README.md")) ? readRelative("README.md") : "";
const hostedDemo = existsSync(path.join(root, "hosted-demo/index.html"))
  ? readRelative("hosted-demo/index.html")
  : "";

const readmeLower = readme.toLowerCase();
const hostedDemoLower = hostedDemo.toLowerCase();
const missingReadmeSnippets = requiredReadmeSnippets.filter((snippet) => !readmeLower.includes(snippet.toLowerCase()));
const missingDemoSnippets = requiredDemoSnippets.filter((snippet) => !hostedDemoLower.includes(snippet.toLowerCase()));
const dependencyChecks = {
  hedera_agent_kit: Boolean(packageJson.dependencies?.["@hashgraph/hedera-agent-kit"]),
  hiero_sdk: Boolean(packageJson.dependencies?.["@hiero-ledger/sdk"]),
  zod: Boolean(packageJson.dependencies?.zod)
};

const approvalGateText = [
  existsSync(path.join(root, "docs/APPROVAL_GATES.md")) ? readRelative("docs/APPROVAL_GATES.md") : "",
  existsSync(path.join(root, "README.md")) ? readRelative("README.md") : "",
  existsSync(path.join(root, "DEPENDENCY_AUDIT.md")) ? readRelative("DEPENDENCY_AUDIT.md") : ""
].join("\n").toLowerCase();
const safetyBoundaryChecks = {
  wallet_approval_gate: approvalGateText.includes("wallet"),
  transaction_approval_gate: approvalGateText.includes("transaction"),
  terms_approval_gate: approvalGateText.includes("terms acceptance"),
  feedback_approval_gate: approvalGateText.includes("feedback")
};

const failures = [
  ...missingFiles.map((relativePath) => `missing required file: ${relativePath}`),
  ...missingReadmeSnippets.map((snippet) => `README missing snippet: ${snippet}`),
  ...missingDemoSnippets.map((snippet) => `hosted demo missing snippet: ${snippet}`),
  ...Object.entries(dependencyChecks)
    .filter(([, ok]) => !ok)
    .map(([name]) => `missing dependency: ${name}`),
  ...Object.entries(safetyBoundaryChecks)
    .filter(([, ok]) => !ok)
    .map(([name]) => `missing safety boundary wording: ${name}`)
];

const report = {
  status: failures.length === 0 ? "PASS" : "FAIL",
  package_name: packageJson.name,
  checks: {
    required_files: {
      expected_count: requiredFiles.length,
      missing: missingFiles
    },
    readme_snippets: {
      missing: missingReadmeSnippets
    },
    hosted_demo_snippets: {
      missing: missingDemoSnippets
    },
    dependencies: dependencyChecks,
    safety_boundaries: safetyBoundaryChecks
  },
  local_mode_guards: {
    wallet_required: false,
    secrets_required: false,
    transaction_submitted: false,
    network_action: "none"
  },
  failures
};

console.log(JSON.stringify(report, null, 2));

if (failures.length > 0) {
  process.exitCode = 1;
}
