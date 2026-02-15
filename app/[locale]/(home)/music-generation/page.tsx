import { notFound } from "next/navigation";
import MusicGenerationClient from "./MusicGenerationClient";

export default function MusicGenerationPage() {
  if (process.env.NEXT_PUBLIC_MUSIC_ENABLED !== "true") {
    notFound();
  }

  return <MusicGenerationClient />;
}

