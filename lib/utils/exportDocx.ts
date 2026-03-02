import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from "docx";
import { saveAs } from "file-saver";

interface DocxExportOptions {
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

export async function downloadDocx(opts: DocxExportOptions) {
  const metaRows: string[] = [];
  if (opts.clientName) metaRows.push(`Client: ${opts.clientName}`);
  if (opts.projectName) metaRows.push(`Project: ${opts.projectName}`);
  metaRows.push(`Type: ${opts.scriptType.replace(/_/g, " ")}`);
  metaRows.push(`Platform: ${opts.platform}`);
  metaRows.push(`Tone: ${opts.tone}`);
  if (opts.audience) metaRows.push(`Audience: ${opts.audience}`);
  if (opts.objective) metaRows.push(`Objective: ${opts.objective}`);
  metaRows.push(`Status: ${opts.status}`);
  metaRows.push(`Score: ${opts.score}/100`);
  metaRows.push(`Words: ${opts.wordCount}`);
  metaRows.push(`Date: ${new Date().toLocaleDateString()}`);

  const children: Paragraph[] = [];

  // Title
  children.push(
    new Paragraph({
      children: [new TextRun({ text: opts.title, bold: true, size: 48, font: "Inter" })],
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.LEFT,
      spacing: { after: 200 },
    })
  );

  // Metadata block
  children.push(
    new Paragraph({
      children: metaRows.map(
        (row, i) =>
          new TextRun({
            text: row + (i < metaRows.length - 1 ? "\n" : ""),
            size: 18,
            color: "666666",
            font: "Inter",
            break: i > 0 ? 1 : undefined,
          })
      ),
      spacing: { after: 400 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      },
    })
  );

  // Hook
  if (opts.hook) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: "HOOK: ", bold: true, size: 22, font: "Inter", color: "7CB342" }),
          new TextRun({ text: opts.hook, size: 22, font: "Inter", italics: true }),
        ],
        spacing: { after: 300 },
      })
    );
  }

  // Script content - split by paragraphs
  const paragraphs = opts.content.split(/\n\n+/);
  for (const para of paragraphs) {
    const lines = para.split("\n");
    children.push(
      new Paragraph({
        children: lines.map(
          (line, i) =>
            new TextRun({
              text: line,
              size: 24,
              font: "Inter",
              break: i > 0 ? 1 : undefined,
            })
        ),
        spacing: { after: 200 },
      })
    );
  }

  const doc = new Document({
    sections: [{ children }],
    creator: "CoScript",
    title: opts.title,
    description: `${opts.scriptType} - ${opts.platform}`,
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${opts.title.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase()}.docx`);
}
