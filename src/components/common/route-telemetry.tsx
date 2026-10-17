import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { telemetry } from '../../services/telemetry-service';
import { T } from '../../telemetry/codes';

/**
 * Reports in-app navigation as `[1002] page.viewed`. The first render is skipped because
 * the provider already reports the landing page as `[1001] app.loaded`.
 */
export const RouteTelemetry: React.FC = () => {
  const { pathname } = useLocation();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    telemetry.emit(T.PAGE_VIEWED, { path: pathname });
  }, [pathname]);
  return null;
};

export default RouteTelemetry;
