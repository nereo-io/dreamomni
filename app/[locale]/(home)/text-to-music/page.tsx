import { notFound } from "next/navigation";
import TextToMusicClient from "./TextToMusicClient";

export default function TextToMusicPage() {
  if (process.env.NEXT_PUBLIC_MUSIC_ENABLED !== "true") {
    notFound();
  }

  return <TextToMusicClient />;
}

