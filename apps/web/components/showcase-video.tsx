import fs from "node:fs";
import path from "node:path";
import { ShowcaseVideoClient } from "./showcase-video-client";

export function ShowcaseVideo({
  src,
  title = "Rendered showcase",
  composition,
}: {
  src: string;
  title?: string;
  composition?: string;
}) {
  const filePath = path.join(process.cwd(), "public", src.replace(/^\//, ""));
  const mp4Exists = fs.existsSync(filePath);

  return (
    <ShowcaseVideoClient
      src={src}
      title={title}
      composition={composition}
      mp4Exists={mp4Exists}
    />
  );
}
