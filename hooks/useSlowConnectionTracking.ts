import { useState, useEffect, useRef } from 'react';
import { usePostHog } from 'posthog-react-native';
import { useNetwork } from '../providers/NetworkProvider';
import { SLOW_CONNECTION_TIMEOUT } from '../constants/constants';

interface UseSlowConnectionTrackingOptions {
    isLoading: boolean;
    page: string;
    context?: Record<string, any>;
}

export function useSlowConnectionTracking({
    isLoading,
    page,
    context = {},
}: UseSlowConnectionTrackingOptions) {
    const { isConnected, isInternetReachable, connectionType } = useNetwork();
    const [isSlowConnection, setIsSlowConnection] = useState(false);
    const slowConnectionTimeoutRef = useRef<number | null>(null);
    const posthog = usePostHog();

    useEffect(() => {
        if (isLoading && isConnected && isInternetReachable) {
            // Start slow connection detection timer
            slowConnectionTimeoutRef.current = setTimeout(() => {
                setIsSlowConnection(true);
                // Track slow connection event
                posthog?.capture('slow_connection_detected', {
                    page,
                    connectionType,
                    timeout: SLOW_CONNECTION_TIMEOUT,
                    ...context,
                });
            }, SLOW_CONNECTION_TIMEOUT);
        } else {
            // Clear slow connection timer when loading completes or connection issues
            if (slowConnectionTimeoutRef.current) {
                clearTimeout(slowConnectionTimeoutRef.current);
                slowConnectionTimeoutRef.current = null;
            }
            setIsSlowConnection(false);
        }

        return () => {
            if (slowConnectionTimeoutRef.current) {
                clearTimeout(slowConnectionTimeoutRef.current);
            }
        };
    }, [isLoading, isConnected, isInternetReachable, page, connectionType, posthog, context]);

    return { isSlowConnection, setIsSlowConnection };
}
