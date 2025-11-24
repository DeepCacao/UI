import path from "path"
import { promises as fs } from "fs"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(
  req: Request,
  context: { params: { file: string[] } }
) {
  const base = path.join(process.cwd(), "src", "app", "_model", "cacao_pod")
  const target = path.join(base, ...(context.params.file || []))
  if (!target.startsWith(base)) {
    return new Response("Forbidden", { status: 403 })
  }
  try {
    const data = await fs.readFile(target)
    const ext = path.extname(target).toLowerCase()
    const type =
      ext === ".glb"
        ? "model/gltf-binary"
        : ext === ".gltf"
        ? "model/gltf+json"
        : ext === ".png"
        ? "image/png"
        : ext === ".jpg" || ext === ".jpeg"
        ? "image/jpeg"
        : "application/octet-stream"
    return new Response(data, {
      headers: { "Content-Type": type }
    })
  } catch {
    return new Response("Not found", { status: 404 })
  }
}
