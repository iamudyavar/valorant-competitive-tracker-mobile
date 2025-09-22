import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Define the type for the match card prop based on your Convex query's transformation
type MatchCardProps = {
    vlrId: string;
    status: 'live' | 'upcoming' | 'completed';
    time: string;
    team1: { name: string; score: number; logoUrl: string; };
    team2: { name: string; score: number; logoUrl: string; };
    event: { name: string; series: string; };
};

const TeamDisplay = ({ name, score, logoUrl, isWinner }: { name: string; score: number; logoUrl: string; isWinner: boolean }) => (
    <View style={styles.teamContainer}>
        <Image source={{ uri: logoUrl }} style={styles.teamLogo} onError={(e) => console.log(e.nativeEvent.error)} />
        <Text style={[styles.teamName, isWinner && styles.winnerName]}>{name}</Text>
        <Text style={[styles.teamScore, isWinner && styles.winnerScore]}>{score}</Text>
    </View>
);

export default function MatchCard({ match }: { match: MatchCardProps }) {
    const router = useRouter();

    const handlePress = () => {
        router.push(`/match/${match.vlrId}` as any);
    };

    const isTeam1Winner = match.status === 'completed' && match.team1.score > match.team2.score;
    const isTeam2Winner = match.status === 'completed' && match.team2.score > match.team1.score;

    return (
        <Pressable onPress={handlePress} style={styles.card}>
            <View style={styles.header}>
                <View style={styles.eventInfo}>
                    <Text style={styles.eventName}>{match.event.name}</Text>
                    <Text style={styles.eventSeries}>{match.event.series}</Text>
                </View>
                {match.status === 'live' && (
                    <View style={styles.liveIndicator}>
                        <Text style={styles.liveText}>LIVE</Text>
                    </View>
                )}
                {match.status === 'upcoming' && (
                    <Text style={styles.timeText}>{match.time}</Text>
                )}
            </View>

            <View style={styles.teamsSection}>
                <TeamDisplay name={match.team1.name} score={match.team1.score} logoUrl={match.team1.logoUrl} isWinner={isTeam1Winner} />
                <TeamDisplay name={match.team2.name} score={match.team2.score} logoUrl={match.team2.logoUrl} isWinner={isTeam2Winner} />
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#1E1E1E',
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 16,
        marginVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
        paddingBottom: 8,
    },
    eventInfo: {
        flex: 1,
    },
    eventName: {
        color: '#E0E0E0',
        fontSize: 14,
        fontFamily: 'Inter_600SemiBold',
    },
    eventSeries: {
        color: '#A0A0A0',
        fontSize: 12,
        fontFamily: 'Inter_400Regular',
    },
    liveIndicator: {
        backgroundColor: '#FF4655',
        borderRadius: 4,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    liveText: {
        color: '#fff',
        fontSize: 12,
        fontFamily: 'Inter_700Bold',
    },
    timeText: {
        color: '#A0A0A0',
        fontSize: 14,
        fontFamily: 'Inter_600SemiBold',
    },
    teamsSection: {
        marginTop: 8,
    },
    teamContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    teamLogo: {
        width: 30,
        height: 30,
        marginRight: 12,
        resizeMode: 'contain',
    },
    teamName: {
        flex: 1,
        color: '#fff',
        fontSize: 16,
        fontFamily: 'Inter_400Regular',
    },
    teamScore: {
        color: '#fff',
        fontSize: 16,
        fontFamily: 'Inter_600SemiBold',
        width: 30,
        textAlign: 'center',
    },
    winnerName: {
        fontFamily: 'Inter_700Bold',
        color: '#3b82f6',
    },
    winnerScore: {
        fontFamily: 'Inter_700Bold',
        color: '#3b82f6',
    },
});
