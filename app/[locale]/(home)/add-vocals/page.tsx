import { notFound } from "next/navigation";
import AddVocalsClient from "./AddVocalsClient";

export default function AddVocalsPage() {
  if (process.env.NEXT_PUBLIC_MUSIC_ENABLED !== "true") {
    notFound();
  }

  return <AddVocalsClient />;
}

