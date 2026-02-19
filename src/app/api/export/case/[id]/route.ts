import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireCaseRole } from "@/lib/auth/require";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: caseId } = await params;
  await requireCaseRole(caseId, "viewer");

  const c = await prisma.case.findUnique({
    where: { id: caseId },
    include: {
      evidence: {
        include: { tags: { include: { tag: true } }, jobs: true },
        orderBy: [{ capturedAt: "asc" }, { createdAt: "asc" }],
      },
      facts: {
        include: {
          evidence: {
            include: {
              evidence: {
                include: { tags: { include: { tag: true } } },
              },
            },
          },
        },
      },
      tags: true,
    },
  });
  if (!c) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const lines: string[] = [];
  lines.push(`# ${c.title}\n`);
  if (c.description) lines.push(`${c.description}\n`);
  lines.push(`## Pessoas envolvidas\n`);
  lines.push(c.peopleInvolved ?? "_Não informado._\n");
  lines.push(`**Status:** ${c.status}\n`);
  lines.push(`---\n`);

  lines.push(`## Timeline\n`);
  for (const e of c.evidence) {
    const date = (e.capturedAt ?? e.createdAt).toISOString();
    const typeLabel = e.type === "image" ? "Imagem" : e.type === "audio" ? "Áudio" : "Texto";
    const tagsStr =
      e.tags.length > 0
        ? ` [${e.tags.map((t) => t.tag.name).join(", ")}]`
        : "";
    lines.push(`- **${date}** — ${typeLabel}${e.fileName ? ` — ${e.fileName}` : ""}${tagsStr}`);
    if (e.notes) lines.push(`  - ${e.notes}`);
    if (e.type === "audio" && e.transcriptText) {
      lines.push(`  - Transcrição: ${e.transcriptText.slice(0, 200)}${e.transcriptText.length > 200 ? "…" : ""}`);
    }
    if (e.type === "image" && e.ocrText) {
      lines.push(`  - OCR: ${e.ocrText.slice(0, 200)}${e.ocrText.length > 200 ? "…" : ""}`);
    }
    lines.push("");
  }

  lines.push(`---\n## Fatos\n`);
  const tagToFacts = new Map<string, typeof c.facts>();
  for (const fact of c.facts) {
    const tagNames = new Set<string>();
    for (const fe of fact.evidence) {
      const ev = fe.evidence as { tags?: { tag: { name: string } }[] };
      for (const t of ev.tags ?? []) {
        tagNames.add(t.tag.name);
      }
    }
    const key = tagNames.size > 0 ? [...tagNames].sort().join(", ") : "Sem tag";
    if (!tagToFacts.has(key)) tagToFacts.set(key, []);
    tagToFacts.get(key)!.push(fact);
  }
  for (const [tagLabel, facts] of tagToFacts) {
    lines.push(`### ${tagLabel}\n`);
    for (const fact of facts) {
      lines.push(`- **${fact.title}**`);
      if (fact.description) lines.push(`  ${fact.description}`);
      if (fact.evidence.length > 0) {
        const names = fact.evidence.map((fe) => fe.evidence.fileName ?? fe.evidenceId);
        lines.push(`  Evidências: ${names.join(", ")}`);
      }
      lines.push("");
    }
  }

  const markdown = lines.join("\n");
  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `inline; filename="case-${caseId}.md"`,
    },
  });
}
