import fs from "node:fs/promises";
import path from "node:path";
import { NodeCompiler } from "@myriaddreamin/typst-ts-node-compiler";
import {
  fillPayslipTemplate,
  type PayslipTemplateVariables,
} from "@/lib/payslip-template-variables";

const PROJECT_ROOT = process.cwd();
const PUBLIC_DIR = path.join(PROJECT_ROOT, "public");
const TEMPLATE_PATH = path.join(PUBLIC_DIR, "default.typ");

let templateCache: string | null = null;

async function loadTemplate(): Promise<string> {
  if (!templateCache) {
    templateCache = await fs.readFile(TEMPLATE_PATH, "utf8");
  }
  return templateCache;
}

export async function compilePayslipPdf(
  variables: PayslipTemplateVariables,
): Promise<Buffer> {
  const template = await loadTemplate();
  const source = fillPayslipTemplate(template, variables);

  if (/\{\{\w+\}\}/.test(source)) {
    throw new Error("Payslip template still contains unfilled placeholders.");
  }

  const compiler = NodeCompiler.create({ workspace: PUBLIC_DIR });
  const pdf = compiler.pdf({ mainFileContent: source });
  if (!pdf || pdf.length === 0) {
    throw new Error("Typst compiler returned an empty PDF.");
  }
  return pdf;
}
