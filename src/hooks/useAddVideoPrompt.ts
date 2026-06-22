import { useCallback } from 'react';
import { useRouteStore } from '@/store/useRouteStore';
import { routeToInput } from '@/utils/routeInput';
import { addMedia } from '@/utils/mediaUtils';
import { confirmAddVideo, pickVideoFromLibrary } from '@/utils/mediaPicker';

/**
 * Returns a handler that, after a climb is marked completed from a list, offers
 * to attach a send video. On opt-in it picks a video, reloads the route's full
 * gallery (list routes don't carry their media), appends the video, and saves.
 */
export function useAddVideoPrompt(): (routeId: number) => void {
  const getRoute = useRouteStore((s) => s.getRoute);
  const editRoute = useRouteStore((s) => s.editRoute);

  return useCallback(
    (routeId: number) => {
      confirmAddVideo(() => {
        void (async () => {
          const video = await pickVideoFromLibrary();
          if (video === null) return;
          const route = await getRoute(routeId);
          if (route === null) return;
          const media = addMedia(
            route.media.map((m) => ({ uri: m.uri, type: m.type, width: m.width, height: m.height })),
            [video],
          );
          await editRoute(routeId, routeToInput(route, { media }));
        })();
      });
    },
    [getRoute, editRoute],
  );
}
