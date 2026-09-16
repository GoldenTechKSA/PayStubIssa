import React, { useRef, useState, useLayoutEffect } from "react";

/** The PRINTABLE width of a US Letter sheet at 96dpi: 8.5in less the 0.5in @page
 *  margins print.css sets, so 7.5in = 720px. Templates are authored to this width
 *  (see CLAUDE.md, one stub one sheet) and the preview renders at exactly the size
 *  the printer will use — which is what lets the Review step promise the preview is
 *  what prints. Using the full 8.5in paper width here would preview 13% wider than
 *  reality. */
const PAGE_WIDTH = 720;

/**
 * Renders its children at a fixed Letter-page width and scales them down (never up)
 * to fit the available width, so the whole paystub shrinks proportionally instead of
 * overflowing the sheet. The transform is screen-only — print.css neutralizes
 * `.paystub-scale` so printing/PDF capture the content at full size.
 */
export const FitPage: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState<number | undefined>(undefined);

  useLayoutEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    const update = () => {
      const avail = outer.clientWidth;
      const s = avail > 0 ? Math.min(1, avail / PAGE_WIDTH) : 1;
      setScale(s);
      setHeight(inner.offsetHeight * s); // offsetHeight ignores the transform
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(outer);
    ro.observe(inner);
    return () => ro.disconnect();
  }, []);

  // The wrappers carry inline sizes computed for the SCALED preview. print.css resets
  // them via these class names — without that, printing at full size overflows a box
  // still sized for the shrunken one.
  return (
    <div ref={outerRef} className="paystub-fit-outer" style={{ width: "100%" }}>
      <div className="paystub-fit-box" style={{ width: PAGE_WIDTH * scale, height, margin: "0 auto" }}>
        <div
          ref={innerRef}
          className="paystub-scale"
          style={{ width: PAGE_WIDTH, transformOrigin: "top left", transform: `scale(${scale})` }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default FitPage;
