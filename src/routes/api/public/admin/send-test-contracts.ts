import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/admin/send-test-contracts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = process.env.TEST_CONTRACTS_TRIGGER_SECRET;
        if (!expected) {
          return Response.json(
            { success: false, error: "secret_not_configured" },
            { status: 500 },
          );
        }
        const provided = request.headers.get("x-trigger-secret") ?? "";
        // constant-time compare via length+xor
        if (
          provided.length !== expected.length ||
          [...provided].reduce((a, c, i) => a | (c.charCodeAt(0) ^ expected.charCodeAt(i)), 0) !== 0
        ) {
          return Response.json({ success: false, error: "unauthorized" }, { status: 401 });
        }
        try {
          const { runTestContractsToLawyer } = await import(
            "@/lib/contracts/testContracts.server"
          );
          const r = await runTestContractsToLawyer();
          return Response.json({
            success: true,
            recipient: r.recipient,
            enqueue: r.enqueue,
            contracts: r.contracts.map((c) => ({
              documentNumber: c.documentNumber,
              title: c.title,
            })),
          });
        } catch (e) {
          const message = e instanceof Error ? e.message : String(e);
          console.error("[send-test-contracts] failed", message);
          return Response.json({ success: false, error: message }, { status: 500 });
        }
      },
    },
  },
});