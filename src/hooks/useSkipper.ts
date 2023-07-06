import {useCallback, useEffect, useRef} from "react";

/**
 * Set `shouldSkip` to `true`, and then it's automatically set to `false` on the
 * next rerender.
 */
export function useSkipper(init: boolean) {
  const shouldSkipRef = useRef(init);
  const shouldSkip = shouldSkipRef.current;

  const skip = useCallback(() => {
    shouldSkipRef.current = false;
  }, []);

  useEffect(() => {
    shouldSkipRef.current = true;
  });

  return [shouldSkip, skip] as const;
}
