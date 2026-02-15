import { notFound } from "next/navigation";
import AddInstrumentalClient from "./AddInstrumentalClient";

export default function AddInstrumentalPage() {
  if (process.env.NEXT_PUBLIC_MUSIC_ENABLED !== "true") {
    notFound();
  }

  return <AddInstrumentalClient />;
}

