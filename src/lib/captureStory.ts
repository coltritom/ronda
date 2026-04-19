export async function captureAndShare(element: HTMLElement, filename = "ronda-story") {
  const html2canvas = (await import("html2canvas")).default;

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#1A1625",
    logging: false,
  });

  return new Promise<void>((resolve) => {
    canvas.toBlob(async (blob) => {
      if (!blob) { resolve(); return; }
      const file = new File([blob], `${filename}.png`, { type: "image/png" });

      const canShare =
        typeof navigator !== "undefined" &&
        !!navigator.share &&
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [file] });

      if (canShare) {
        try {
          await navigator.share({ files: [file] });
        } catch {
          downloadBlob(blob, filename);
        }
      } else {
        downloadBlob(blob, filename);
      }
      resolve();
    }, "image/png");
  });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
