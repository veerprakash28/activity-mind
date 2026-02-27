import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Keyboard } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HeaderHeightContext } from '@react-navigation/elements';
import { useAppContext } from '../context/AppContext';
import { ActivityCard } from '../components/ActivityCard';
import { Activity, addCustomActivity } from '../database/database';
import { processAIChat, AIChatResponse } from '../database/smartEngine';
import { StatusModal, StatusType } from '../components/StatusModal';
import { ActivityDetailModal } from '../components/ActivityDetailModal';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    activities?: Activity[];
    timestamp: Date;
    engine?: 'gemini' | 'heuristic';
}

export const BrainstormScreen = ({ navigation }: any) => {
    const { theme, organization } = useAppContext();
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: `Hi! I'm your AI Brainstorm partner. ${new Date().getHours() < 12 ? 'Good morning!' :
                new Date().getHours() < 18 ? 'Good afternoon!' : 'Good evening!'
                } Ready to architect some custom activities for ${organization?.companyName || 'your team'}?`,
            sender: 'ai',
            timestamp: new Date()
        }
    ]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [typingMessage, setTypingMessage] = useState('AI is thinking...');
    const scrollRef = useRef<ScrollView>(null);

    // Detail Modal State
    const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
    const [detailVisible, setDetailVisible] = useState(false);

    // Status Modal State
    const [statusVisible, setStatusVisible] = useState(false);
    const [statusType, setStatusType] = useState<StatusType>('success');
    const [statusTitle, setStatusTitle] = useState('');
    const [statusMessage, setStatusMessage] = useState('');

    useEffect(() => {
        // Scroll to bottom when messages change
        setTimeout(() => {
            scrollRef.current?.scrollToEnd({ animated: true });
        }, 100);
    }, [messages, isTyping]);

    const handleSend = async () => {
        if (!inputText.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            text: inputText,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        const currentInput = inputText;
        setInputText('');
        setIsTyping(true);

        // Thought Trajectory Sequence
        const thoughts = [
            "Analyzing team profile...",
            `Scanning ${organization?.industry || 'industry'} patterns...`,
            "Drafting custom variants...",
            "Finalizing architect drafts..."
        ];

        for (let i = 0; i < thoughts.length; i++) {
            setTypingMessage(thoughts[i]);
            await new Promise(r => setTimeout(r, 600 + Math.random() * 400));
        }

        try {
            const response: AIChatResponse = await processAIChat(currentInput, messages.map(m => ({ role: m.sender, content: m.text })), organization);

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: response.message,
                sender: 'ai',
                activities: response.suggestedActivities,
                timestamp: new Date(),
                engine: response.engine
            };

            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            console.error("AI Error:", error);
        } finally {
            setIsTyping(false);
        }
    };

    const saveToBank = async (activity: Activity) => {
        try {
            await addCustomActivity({
                name: activity.name,
                description: activity.description,
                category: activity.category,
                steps: JSON.stringify(activity.steps ? (typeof activity.steps === 'string' ? JSON.parse(activity.steps) : activity.steps) : ["Collaborate with your team"]),
                materials: JSON.stringify(activity.materials ? (typeof activity.materials === 'string' ? JSON.parse(activity.materials) : activity.materials) : ["None"]),
                estimated_cost: activity.estimated_cost,
                duration: activity.duration,
                difficulty: activity.difficulty || 'Medium',
                prep_time: activity.prep_time || '10 min',
                min_employees: activity.min_employees,
                max_employees: activity.max_employees,
                indoor_outdoor: activity.indoor_outdoor,
                remote_compatible: activity.remote_compatible
            });

            setStatusType('success');
            setStatusTitle('Brainstorm Saved!');
            setStatusMessage(`"${activity.name}" variant has been added to your bank.`);
            setStatusVisible(true);
        } catch (error) {
            setStatusType('error');
            setStatusTitle('Oops!');
            setStatusMessage('Failed to save activity. Please try again.');
            setStatusVisible(true);
        }
    };

    const renderMessage = (message: Message) => {
        const isAI = message.sender === 'ai';
        return (
            <View key={message.id} style={[styles.messageWrapper, isAI ? styles.aiWrapper : styles.userWrapper]}>
                {isAI && (
                    <View style={[styles.avatar, { backgroundColor: theme.colors.primary, marginRight: 12 }]}>
                        <MaterialCommunityIcons name="robot" size={16} color="#FFF" />
                    </View>
                )}
                <View style={{ flex: 1, alignItems: isAI ? 'flex-start' : 'flex-end' }}>
                    <View style={[
                        styles.bubble,
                        isAI ?
                            { backgroundColor: theme.colors.surface, borderBottomLeftRadius: 4 } :
                            { backgroundColor: theme.colors.primary, borderBottomRightRadius: 4 }
                    ]}>
                        <Text style={[styles.messageText, { color: isAI ? theme.colors.text : '#FFF' }]}>
                            {message.text}
                        </Text>
                        {isAI && message.engine && (
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                marginTop: 6,
                                opacity: 0.8,
                                gap: 4,
                                paddingTop: 4,
                                borderTopWidth: 1,
                                borderTopColor: theme.colors.primary + '20'
                            }}>
                                <MaterialCommunityIcons
                                    name={message.engine === 'gemini' ? "rhombus-split" : "cog-refresh-outline"}
                                    size={10}
                                    color={theme.colors.primary}
                                />
                                <Text style={{ fontSize: 9, color: theme.colors.primary, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                    {message.engine === 'gemini' ? "Powered by Gemini" : "Heuristic Fallback"}
                                </Text>
                            </View>
                        )}
                    </View>

                    {message.activities && message.activities.length > 0 && (
                        <View style={styles.activityContainer}>
                            <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginBottom: 8, marginLeft: 4 }]}>
                                Brainstorm Drafts (Tap to view details)
                            </Text>
                            {message.activities.map((act, i) => (
                                <View key={i} style={styles.activityCardWrapper}>
                                    <ActivityCard
                                        activity={act}
                                        expanded={false}
                                        onPress={() => {
                                            setSelectedActivity(act);
                                            setDetailVisible(true);
                                        }}
                                    />
                                    <TouchableOpacity
                                        style={[styles.saveBtn, { backgroundColor: theme.colors.primary }]}
                                        onPress={() => saveToBank(act)}
                                    >
                                        <MaterialCommunityIcons name="plus-circle-outline" size={18} color="#FFF" />
                                        <Text style={styles.saveBtnText}>Save this Variant</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            </View>
        );
    };

    const insets = useSafeAreaInsets();
    const [keyboardVisible, setKeyboardVisible] = useState(false);

    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

        const showSubscription = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
        const hideSubscription = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
        return () => {
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, []);

    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.background, paddingTop: Math.max(insets.top, 0) }}>
            <HeaderHeightContext.Consumer>
                {headerHeight => (
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        style={[styles.container, { backgroundColor: theme.colors.background }]}
                        keyboardVerticalOffset={Platform.OS === 'ios' ? 70 : 0} // Standard offset
                    >
                        <ScrollView
                            ref={scrollRef}
                            contentContainerStyle={styles.scrollContent}
                            showsVerticalScrollIndicator={false}
                        >
                            {messages.map(renderMessage)}
                            {isTyping && (
                                <View style={[styles.messageWrapper, styles.aiWrapper]}>
                                    <View style={[styles.avatar, { backgroundColor: theme.colors.primary, marginRight: 12 }]}>
                                        <MaterialCommunityIcons name="robot" size={16} color="#FFF" />
                                    </View>
                                    <View style={[styles.bubble, { backgroundColor: theme.colors.surface, borderBottomLeftRadius: 4, paddingVertical: 12 }]}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                            <ActivityIndicator size="small" color={theme.colors.primary} />
                                            <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, fontStyle: 'italic' }]}>
                                                {typingMessage}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            )}
                        </ScrollView>

                        <View style={[
                            styles.inputContainer,
                            {
                                backgroundColor: theme.colors.surface,
                                borderTopColor: theme.colors.border,
                                paddingBottom: keyboardVisible ? 2 : Math.max(insets.bottom, 12)
                            }
                        ]}>
                            <TextInput
                                style={[styles.input, { color: theme.colors.text, backgroundColor: theme.colors.background }]}
                                placeholder="Refine this idea with the AI..."
                                placeholderTextColor={theme.colors.textSecondary}
                                value={inputText}
                                onChangeText={setInputText}
                                multiline={false} // Change to false for standard 'Enter to send' behavior
                                onSubmitEditing={handleSend}
                                returnKeyType="send"
                                blurOnSubmit={false}
                            />
                            <TouchableOpacity
                                style={[styles.sendBtn, { backgroundColor: theme.colors.primary, opacity: inputText.trim() ? 1 : 0.6 }]}
                                onPress={handleSend}
                                disabled={!inputText.trim() || isTyping}
                            >
                                <MaterialCommunityIcons name="send" size={20} color="#FFF" />
                            </TouchableOpacity>
                        </View>

                        <ActivityDetailModal
                            activity={selectedActivity}
                            visible={detailVisible}
                            onClose={() => setDetailVisible(false)}
                            hideSave
                            hideSchedule
                        />

                        <StatusModal
                            visible={statusVisible}
                            type={statusType}
                            title={statusTitle}
                            message={statusMessage}
                            onConfirm={() => setStatusVisible(false)}
                            onClose={() => setStatusVisible(false)}
                        />
                    </KeyboardAvoidingView>
                )}
            </HeaderHeightContext.Consumer>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: 16, paddingTop: 10, paddingBottom: 10 },
    messageWrapper: { flexDirection: 'row', marginBottom: 16, maxWidth: '85%' },
    aiWrapper: { alignSelf: 'flex-start' },
    userWrapper: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
    avatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
    bubble: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1 },
    messageText: { fontSize: 15, lineHeight: 22 },
    activityContainer: { marginTop: 12, width: '100%' },
    activityCardWrapper: { marginBottom: 12 },
    saveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 12,
        marginTop: -10, // Overlap card slightly
        marginHorizontal: 10,
        zIndex: 10
    },
    saveBtnText: { color: '#FFF', fontWeight: 'bold', marginLeft: 6, fontSize: 13 },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 8,
        paddingTop: 8,
        borderTopWidth: 1
    },
    input: { flex: 1, borderRadius: 24, paddingHorizontal: 18, paddingVertical: 10, maxHeight: 100, fontSize: 15, marginRight: 10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
    sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }
});
