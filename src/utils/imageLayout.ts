// Resolution-independent overlay math. The planner stores every hold/limb as a
// normalized (0..1) point relative to the image's intrinsic pixels, never in
// screen pixels — so a plan made on one device renders correctly on any other.
//
// `imageLayout` computes the on-screen rectangle of a `resizeMode="contain"`
// image inside its container (the same fit RouteCard/MediaViewer use). Points
// are then mapped to/from that rect by `src/utils/coords.ts`.

/** The letterboxed rectangle a contain-fit image occupies inside its container. */
export interface ImageRect {
  /** Rendered image width in container (screen) units. */
  displayedW: number;
  /** Rendered image height in container (screen) units. */
  displayedH: number;
  /** Left inset from the container edge to the image. */
  offsetX: number;
  /** Top inset from the container edge to the image. */
  offsetY: number;
}

const EMPTY: ImageRect = { displayedW: 0, displayedH: 0, offsetX: 0, offsetY: 0 };

/**
 * Compute the centered contain-fit rect for an image of intrinsic size
 * `imgW`×`imgH` rendered inside a `containerW`×`containerH` box. Returns a zero
 * rect when any dimension is unknown or non-positive (e.g. before layout, or a
 * media item whose dimensions weren't captured).
 */
export function imageLayout(
  containerW: number,
  containerH: number,
  imgW: number,
  imgH: number,
): ImageRect {
  if (containerW <= 0 || containerH <= 0 || imgW <= 0 || imgH <= 0) {
    return EMPTY;
  }

  const imgAspect = imgW / imgH;
  const containerAspect = containerW / containerH;

  let displayedW: number;
  let displayedH: number;
  if (containerAspect > imgAspect) {
    // Container is wider than the image → the image is height-limited.
    displayedH = containerH;
    displayedW = containerH * imgAspect;
  } else {
    // The image is width-limited (or aspects match).
    displayedW = containerW;
    displayedH = containerW / imgAspect;
  }

  return {
    displayedW,
    displayedH,
    offsetX: (containerW - displayedW) / 2,
    offsetY: (containerH - displayedH) / 2,
  };
}
