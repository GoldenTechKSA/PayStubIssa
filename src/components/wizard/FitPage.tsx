import React, { useRef, useState, useLayoutEffect } from "react";

/** US Letter width at 96dpi (8.5in). The paystub templates are authored to look
 *  right at roughly this width, so we render at this size and scale to fit. */
const PAGE_WIDTH = 816;

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

  return (
    <div ref={outerRef} style={{ width: "100%" }}>
      <div style={{ width: PAGE_WIDTH * scale, height, margin: "0 auto" }}>
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
