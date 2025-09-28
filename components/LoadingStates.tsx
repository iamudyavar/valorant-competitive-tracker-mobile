import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Colors } from '../theme/colors';
import { useNetwork } from '../providers/NetworkProvider';

interface LoadingStateProps {
    message?: string;
    showRetry?: boolean;
    onRetry?: () => void;
}

export function LoadingSpinner({ message = "Loading..." }: { message?: string }) {
    return (
        <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.textPrimary} />
            <Text style={styles.loadingText}>{message}</Text>
        </View>
    );
}

export function OfflineState({ onRetry }: { onRetry?: () => void }) {
    const { connectionType } = useNetwork();

    return (
        <View style={styles.centered}>
            <Text style={styles.offlineIcon}>📡</Text>
            <Text style={styles.offlineTitle}>No Internet Connection</Text>
            <Text style={styles.offlineMessage}>
                {connectionType === 'none'
                    ? "You're currently offline. Please check your internet connection."
                    : "Unable to connect to the server. Please check your connection and try again."
                }
            </Text>
            {onRetry && (
                <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
                    <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

export function SlowConnectionState({ onRetry }: { onRetry?: () => void }) {
    return (
        <View style={styles.centered}>
            <Text style={styles.slowIcon}>🐌</Text>
            <Text style={styles.slowTitle}>Slow Connection</Text>
            <Text style={styles.slowMessage}>
                Your connection seems slow. This might take a moment...
            </Text>
            {onRetry && (
                <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
                    <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

export function ErrorState({
    message = "Something went wrong",
    onRetry
}: {
    message?: string;
    onRetry?: () => void;
}) {
    return (
        <View style={styles.centered}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorTitle}>Error</Text>
            <Text style={styles.errorMessage}>{message}</Text>
            {onRetry && (
                <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
                    <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

export function EmptyState({
    message = "No data available",
    icon = "📭"
}: {
    message?: string;
    icon?: string;
}) {
    return (
        <View style={styles.centered}>
            <Text style={styles.emptyIcon}>{icon}</Text>
            <Text style={styles.emptyMessage}>{message}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: Colors.background,
    },
    loadingText: {
        color: Colors.textSecondary,
        fontSize: 16,
        fontFamily: 'Inter_400Regular',
        marginTop: 12,
        textAlign: 'center',
    },
    offlineIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    offlineTitle: {
        color: Colors.textPrimary,
        fontSize: 20,
        fontFamily: 'Inter_600SemiBold',
        marginBottom: 8,
        textAlign: 'center',
    },
    offlineMessage: {
        color: Colors.textSecondary,
        fontSize: 16,
        fontFamily: 'Inter_400Regular',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    slowIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    slowTitle: {
        color: Colors.textPrimary,
        fontSize: 20,
        fontFamily: 'Inter_600SemiBold',
        marginBottom: 8,
        textAlign: 'center',
    },
    slowMessage: {
        color: Colors.textSecondary,
        fontSize: 16,
        fontFamily: 'Inter_400Regular',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    errorIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    errorTitle: {
        color: Colors.textPrimary,
        fontSize: 20,
        fontFamily: 'Inter_600SemiBold',
        marginBottom: 8,
        textAlign: 'center',
    },
    errorMessage: {
        color: Colors.textSecondary,
        fontSize: 16,
        fontFamily: 'Inter_400Regular',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    emptyMessage: {
        color: Colors.textSecondary,
        fontSize: 16,
        fontFamily: 'Inter_400Regular',
        textAlign: 'center',
        lineHeight: 22,
    },
    retryButton: {
        backgroundColor: Colors.textPrimary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: Colors.background,
        fontSize: 16,
        fontFamily: 'Inter_600SemiBold',
    },
});
