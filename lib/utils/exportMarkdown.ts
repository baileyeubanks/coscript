interface MarkdownExportOptions {
  title: string;
  scriptType: string;
  audience: string;
  objective: string;
  tone: string;
  platform: string;
  hook: string;
  content: string;
  score: number;
  status: string;
  clientName?: string;
  projectName?: string;
  wordCount: number;
}

export function exportMarkdown(opts: MarkdownExportOptions): string {
  const frontmatter = [
    "---",
    `title: "${opts.title}"`,
    `type: ${opts.scriptType}`,
    `platform: ${opts.platform}`,
    `tone: ${opts.tone}`,
    `status: ${opts.status}`,
    `score: ${opts.score}`,
    `words: ${opts.wordCount}`,
  ];

  if (opts.audience) frontmatter.push(`audience: "${opts.audience}"`);
  if (opts.objective) frontmatter.push(`objective: "${opts.objective}"`);
  if (opts.clientName) frontmatter.push(`client: "${opts.clientName}"`);
  if (opts.projectName) frontmatter.push(`project: "${opts.projectName}"`);

  frontmatter.push(`date: "${new Date().toISOString().split("T")[0]}"`);
  frontmatter.push("---");

  const sections: string[] = [frontmatter.join("\n"), "", `# ${opts.title}`, ""];

  if (opts.hook) {
    sections.push(`> **Hook:** ${opts.hook}`, "");
  }

  sections.push(opts.content);

  return sections.join("\n");
}

export function downloadMarkdown(opts: MarkdownExportOptions) {
  const md = exportMarkdown(opts);
  const blob = new Blob([md], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${opts.title.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase()}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
