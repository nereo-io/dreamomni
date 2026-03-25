"use client";

import Clarity from "./clarity";

export default function Analytics() {
  if (process.env.NODE_ENV !== "production") {
    return null;
  }

  return (
    <>
      <Clarity />
    </>
  );
}
