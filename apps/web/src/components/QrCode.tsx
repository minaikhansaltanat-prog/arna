"use client";

import { useEffect, useState } from "react";
import qrcode from "qrcode-generator";

/** QR code of this very page (so a desktop visitor can open the demo on a phone). Generated in the browser, no network. */
export function QrCode({ label }: { label: string }) {
  const [svg, setSvg] = useState("");

  useEffect(() => {
    const qr = qrcode(0, "M");
    qr.addData(window.location.href.split("#")[0]);
    qr.make();
    setSvg(qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true }));
  }, []);

  return <div className="qr" role="img" aria-label={label} dangerouslySetInnerHTML={{ __html: svg }} />;
}
