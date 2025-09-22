import React, { ReactNode } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { CONVEX_URL } from '@env';

// Initialize the Convex client
const convex = new ConvexReactClient(CONVEX_URL, {
    unsavedChangesWarning: false,
});

// Create a provider component
export function ConvexClientProvider({ children }: { children: ReactNode }) {
    return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
