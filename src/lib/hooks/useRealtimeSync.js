import { useState, useEffect, useCallback } from 'react';

// Note: Dans une vraie appli, utiliser Socket.io-client ou Yjs.
// var socket = io();

export function useRealtimeSync(siteId, initialContent) {
  const [content, setContent] = useState(initialContent);

  useEffect(() => {
    // Initialisation WebSocket / Yjs room avec siteId
    // socket.emit('join-site', siteId);
    
    // Écoute des changements venant d'autres éditeurs
    // socket.on('content-updated', (newContent) => {
    //   setContent(newContent);
    // });

    return () => {
      // Nettoyage: socket.off('content-updated'); socket.emit('leave-site', siteId);
    };
  }, [siteId]);

  const updateContent = useCallback((newContent) => {
    // 1. Mise à jour optimiste locale (très rapide, fluide pour le Drag & drop)
    setContent(newContent);
    
    // 2. Emission de la modification via WebSocket aux autres clients et au serveur
    // socket.emit('update-content', { siteId, content: newContent });
    
  }, [siteId]);

  return { content, updateContent };
}