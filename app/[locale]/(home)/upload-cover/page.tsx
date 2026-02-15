import { notFound } from "next/navigation";
import UploadCoverClient from "./UploadCoverClient";

export default function UploadCoverPage() {
  if (process.env.NEXT_PUBLIC_MUSIC_ENABLED !== "true") {
    notFound();
  }

  return <UploadCoverClient />;
}

