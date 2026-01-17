
import { useEffect, useRef } from 'react';

const MODAL_MARKER = 'vidyasetu_layer_id';

/**
 * Handles Android Back Button.
 * Optimized for APK/WebView environments where window.history might behave differently.
 */
export const useModalBackHandler = (isOpen: boolean, onClose: () => void) => {
  const onCloseRef = useRef(onClose);
  const layerIdRef = useRef<number | null>(null);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      const layerId = Date.now();
      layerIdRef.current = layerId;

      try {
        // Push state only if we're not already in this layer
        if (!window.history.state || window.history.state[MODAL_MARKER] !== layerId) {
          window.history.pushState({ [MODAL_MARKER]: layerId }, '', window.location.href);
        }
      } catch (e) {
        console.warn("History push failed in APK environment", e);
      }

      const handlePopState = (event: PopStateEvent) => {
        // If user presses back, the state changes.
        // We trigger onClose if the state is missing or doesn't match our layerId
        const state = event.state;
        if (!state || state[MODAL_MARKER] !== layerId) {
          onCloseRef.current();
        }
      };

      window.addEventListener('popstate', handlePopState);

      return () => {
        window.removeEventListener('popstate', handlePopState);
        // Cleanup: Go back only if the current state is still our modal's state
        try {
          if (window.history.state && window.history.state[MODAL_MARKER] === layerId) {
            window.history.back();
          }
        } catch (e) {}
        layerIdRef.current = null;
      };
    }
  }, [isOpen]);
};
