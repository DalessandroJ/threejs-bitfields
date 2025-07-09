import { useEffect, useRef } from 'react';
import BitApp from './bitfields/app.js';   // Three engine

export default function BitfieldsCanvas({ apiRef, onReady }) {
    const container = useRef(null);     // div that will hold the canvas

    useEffect(() => {
        // start engine, injecting canvas into container
        const app = new BitApp({ debug: true, container: container.current });
        app.start();

        if (apiRef) apiRef.current = app;
        onReady?.(app);
        window.app = app;

        // cleanup – remove canvas on unmount
        return () => {
            if (app.renderer?.domElement) {
                app.renderer.domElement.remove();
            }
            if (apiRef) apiRef.current = null;
        };
    }, []);

    // container fills root; engine sets canvas size to window
    return (
        <div
            ref={container}
            style={{ width: '100%', height: '100%', overflow: 'hidden' }}
        />
    );
}
