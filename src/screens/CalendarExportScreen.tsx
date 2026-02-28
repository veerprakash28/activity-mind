import React, { useRef, useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Platform,
    Dimensions,
    TextInput,
    Modal,
    Image,
    ActivityIndicator,
    Switch,
    FlatList,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
// @ts-ignore
import * as FileSystem from 'expo-file-system/legacy';
import { useAppContext } from '../context/AppContext';
import { getMonthlyScheduledActivities, Activity, ActivityHistory } from '../database/database';
import { StatusModal } from '../components/StatusModal';
import { EXPORT_UI_THEMES, UITheme } from '../database/exportThemes';

const { width } = Dimensions.get('window');
const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT_DEFAULT = 850;

type ActivityWithHistory = ActivityHistory & Activity;

export const CalendarExportScreen = ({ navigation }: any) => {
    const { theme, organization } = useAppContext();
    const viewShotRef = useRef<ViewShot>(null);

    const [loading, setLoading] = useState(true);
    const [activities, setActivities] = useState<ActivityWithHistory[]>([]);
    const [currentDate, setCurrentDate] = useState(() => {
        const now = new Date();
        if (now.getDate() >= 25) {
            return new Date(now.getFullYear(), now.getMonth() + 1, 1);
        }
        return now;
    });

    const [statusVisible, setStatusVisible] = useState(false);
    const [statusType, setStatusType] = useState<'success' | 'error' | 'info'>('info');
    const [statusTitle, setStatusTitle] = useState('');
    const [statusMessage, setStatusMessage] = useState('');

    const [customTagline, setCustomTagline] = useState(organization?.tagline || 'Team Engagement Plan');
    const [previewVisible, setPreviewVisible] = useState(false);

    // UI Theme & Branding states
    const [activeTheme, setActiveTheme] = useState<UITheme>(EXPORT_UI_THEMES[0]);
    const [useBranding, setUseBranding] = useState(false);

    // Interactive Icon States
    const [customIconMap, setCustomIconMap] = useState<Record<string, string>>({});
    const [pickerVisible, setPickerVisible] = useState(false);
    const [editingActivityName, setEditingActivityName] = useState<string | null>(null);

    // Derived colors
    const primaryColor = useBranding ? theme.colors.primary : activeTheme.primaryColor;
    const accentColor = useBranding ? theme.colors.secondary : activeTheme.accentColor;

    // Visibility helpers for live preview & canvas (ensure text is visible on dark backgrounds)
    const isDarkBackground = useBranding && theme.isDark;
    const canvasTextColor = isDarkBackground ? '#FFFFFF' : '#1A202C';
    const canvasSecondaryTextColor = isDarkBackground ? '#CBD5E0' : '#718096';
    const canvasCardBg = isDarkBackground ? '#2D3748' : '#FFFFFF';
    const canvasBorderColor = isDarkBackground ? 'rgba(255,255,255,0.1)' : '#E8ECF1';
    const bg = useBranding ? theme.colors.background : activeTheme.backgroundColor;

    useEffect(() => {
        loadData(currentDate);
    }, [currentDate]);

    const loadData = async (date: Date) => {
        setLoading(true);
        const year = date.getFullYear();
        const month = date.getMonth();
        const data = await getMonthlyScheduledActivities(year, month);
        setActivities(data);
        setLoading(false);
    };

    const handlePrevMonth = () => {
        const d = new Date(currentDate);
        d.setMonth(d.getMonth() - 1);
        setCurrentDate(d);
    };

    const handleNextMonth = () => {
        const d = new Date(currentDate);
        d.setMonth(d.getMonth() + 1);
        setCurrentDate(d);
    };

    const handlePickCustomIcon = (activityName: string) => {
        setEditingActivityName(activityName);
        setPickerVisible(true);
    };

    const pickImageFromLibrary = async () => {
        if (!editingActivityName) return;

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
            base64: true,
        });

        if (!result.canceled && result.assets && result.assets[0].base64) {
            const base64Uri = `data:image/png;base64,${result.assets[0].base64}`;
            setCustomIconMap(prev => ({
                ...prev,
                [editingActivityName]: base64Uri
            }));
            setPickerVisible(false);
            setEditingActivityName(null);
        }
    };

    const handleEmojiSelect = (emoji: string) => {
        if (!editingActivityName) return;
        setCustomIconMap(prev => ({
            ...prev,
            [editingActivityName]: emoji
        }));
        setPickerVisible(false);
        setEditingActivityName(null);
    };

    const handleExport = async () => {
        if (!viewShotRef.current) return;

        setStatusType('info');
        setStatusTitle('Generating Image');
        setStatusMessage('Creating your premium HR calendar...');
        setStatusVisible(true);

        try {
            // @ts-ignore
            const uri = await viewShotRef.current.capture();

            if (uri) {
                setStatusVisible(false);
                await Sharing.shareAsync(uri, {
                    mimeType: 'image/png',
                    dialogTitle: 'Share your Monthly HR Calendar',
                    UTI: 'public.png'
                });
            }
        } catch (error) {
            console.error('Export failed:', error);
            setStatusType('error');
            setStatusTitle('Export Failed');
            setStatusMessage('Could not generate the calendar image. Please try again.');
            setStatusVisible(true);
        }
    };

    const handleSVGExport = async () => {
        try {
            setStatusType('info');
            setStatusTitle('Generating SVG');
            setStatusMessage('Please wait while we prepare your editable calendar...');
            setStatusVisible(true);

            const svgContent = await generateSVGContent();
            const fileName = `ActivityMind_Calendar_${currentDate.getFullYear()}_${currentDate.getMonth() + 1}.svg`;
            const fileUri = `${FileSystem.documentDirectory}${fileName}`;

            await FileSystem.writeAsStringAsync(fileUri, svgContent, {
                encoding: 'utf8',
            });

            if (Platform.OS === 'android') {
                const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
                if (permissions.granted) {
                    const base64Content = await FileSystem.readAsStringAsync(fileUri, { encoding: 'base64' });
                    const newUri = await FileSystem.StorageAccessFramework.createFileAsync(
                        permissions.directoryUri,
                        fileName,
                        'image/svg+xml'
                    );
                    await FileSystem.writeAsStringAsync(newUri, base64Content, { encoding: 'base64' });

                    setStatusType('success');
                    setStatusTitle('Download Complete');
                    setStatusMessage(`SVG file has been saved to your selected folder.`);
                    setStatusVisible(true);
                } else {
                    // Fallback to sharing if permission denied
                    await Sharing.shareAsync(fileUri, {
                        mimeType: 'image/svg+xml',
                        dialogTitle: 'Share Editable SVG',
                        UTI: 'public.svg-image',
                    });
                    setStatusVisible(false);
                }
            } else {
                // iOS
                await Sharing.shareAsync(fileUri, {
                    mimeType: 'image/svg+xml',
                    dialogTitle: 'Save Editable SVG',
                    UTI: 'public.svg-image',
                });
                setStatusVisible(false);
            }
        } catch (err) {
            console.error('SVG Export failed:', err);
            setStatusType('error');
            setStatusTitle('Export Failed');
            setStatusMessage('Could not generate SVG file.');
            setStatusVisible(true);
        }
    };

    const generateSVGContent = async () => {
        const monthName = currentDate.toLocaleString('default', { month: 'long' });
        const yearNum = currentDate.getFullYear();

        // Activity Map for Grid
        const activityMap: { [key: number]: ActivityWithHistory[] } = {};
        activities.forEach(acc => {
            const day = new Date(acc.scheduled_date).getDate();
            if (!activityMap[day]) activityMap[day] = [];
            activityMap[day].push(acc);
        });

        // Logo handling
        let logoBase64 = '';
        if (organization?.orgLogoUri) {
            try {
                logoBase64 = await FileSystem.readAsStringAsync(organization.orgLogoUri, {
                    encoding: 'base64',
                });
            } catch (e) {
                console.warn('Could not read logo for SVG:', e);
            }
        }

        const bg = useBranding ? theme.colors.background : activeTheme.backgroundColor;
        const pColor = primaryColor;
        const aColor = accentColor;

        let svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="1000" height="850" viewBox="0 0 1000 850" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <clipPath id="circleClip" clipPathUnits="objectBoundingBox">
            <circle cx="0.5" cy="0.5" r="0.5" />
        </clipPath>
    </defs>
    <rect width="1000" height="850" fill="${bg}" />
`;

        if (activeTheme.layoutType === 'structured') {
            svg += `
    <rect width="1000" height="80" fill="${pColor}" />
    <text x="500" y="52" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="#FFFFFF" text-anchor="middle">HR CALENDAR</text>
    
    <line x1="500" y1="120" x2="500" y2="750" stroke="#E8ECF1" stroke-width="1.5" />
    
    <text x="100" y="150" font-family="Arial, sans-serif" font-size="34" font-weight="800" fill="${pColor}">${monthName} ${yearNum}</text>
    
    <g transform="translate(60, 180)">
        ${generateSVGGrid(aColor, 60, 60, activityMap)}
    </g>

    <g transform="translate(540, 120)">
        <text x="0" y="30" font-family="Arial, sans-serif" font-size="34" font-weight="900" fill="${pColor}">Events</text>
        <g transform="translate(0, 70)">
            ${sortedGroupedActivities.slice(0, 4).map((acc, i) => `
            <g transform="translate(0, ${i * 140})">
                <rect width="400" height="120" rx="20" fill="${canvasCardBg}" stroke="${aColor}30" stroke-width="1.5" />
                <circle cx="50" cy="60" r="30" fill="${aColor}15" />
                ${customIconMap[acc.name] ? (
                    customIconMap[acc.name].startsWith('data:image') ?
                        `<image x="25" y="35" width="50" height="50" href="${customIconMap[acc.name]}" clip-path="url(#circleClip)" preserveAspectRatio="xMidYMid slice" />` :
                        `<text x="50" y="60" font-family="Arial, sans-serif" font-size="24" text-anchor="middle" dominant-baseline="central">${customIconMap[acc.name]}</text>`
                ) : (
                    `<text x="50" y="60" font-family="Arial, sans-serif" font-size="24" text-anchor="middle" dominant-baseline="central">${extractEmoji(acc.name) || '⭐'}</text>`
                )}
                <text x="100" y="45" font-family="Arial, sans-serif" font-size="20" font-weight="800" fill="${canvasTextColor}" dominant-baseline="central">${stripEmoji(acc.name)}</text>
                <text x="380" y="45" font-family="Arial, sans-serif" font-size="15" font-weight="800" fill="${aColor}" text-anchor="end" dominant-baseline="central">${acc.display_date || ''}</text>
                <text x="100" y="75" font-family="Arial, sans-serif" font-size="14" fill="${canvasSecondaryTextColor}" dominant-baseline="central">${acc.description.substring(0, 120).replace(/[<>&"']/g, "")}...</text>
            </g>`).join('')}
        </g>
    </g>

    ${logoBase64 ? `<image x="410" y="770" width="180" height="60" href="data:image/png;base64,${logoBase64}" />` : ''}
`;
        } else if (activeTheme.layoutType === 'playful') {
            svg += `
    <rect x="60" y="60" width="180" height="40" rx="12" fill="${pColor}" />
    <text x="150" y="85" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#FFFFFF" text-anchor="middle" letter-spacing="2">HR CALENDAR</text>

    <text x="60" y="180" font-family="Arial, sans-serif" font-size="85" font-weight="900" fill="${pColor}" letter-spacing="-2">${monthName}</text>
    <text x="60" y="230" font-family="Arial, sans-serif" font-size="36" font-weight="300" fill="${aColor}" letter-spacing="10">${yearNum}</text>

    <g transform="translate(60, 300)">
        ${sortedGroupedActivities.slice(0, 5).map((acc, i) => `
        <g transform="translate(0, ${i * 105})">
            <rect x="0" y="0" width="8" height="85" fill="${aColor}" rx="4" />
            <g transform="translate(25, 25)">
                ${customIconMap[acc.name] ? (
                    customIconMap[acc.name].startsWith('data:image') ?
                        `<image x="-15" y="-15" width="30" height="30" href="${customIconMap[acc.name]}" clip-path="url(#circleClip)" preserveAspectRatio="xMidYMid slice" />` :
                        `<text x="0" y="0" font-family="Arial, sans-serif" font-size="24" font-weight="900" fill="${canvasTextColor}" dominant-baseline="central">${customIconMap[acc.name]}</text>`
                ) : (
                    `<text x="0" y="0" font-family="Arial, sans-serif" font-size="24" font-weight="900" fill="${canvasTextColor}" dominant-baseline="central">${extractEmoji(acc.name) || ''}</text>`
                )}
                <text x="35" y="0" font-family="Arial, sans-serif" font-size="24" font-weight="900" fill="${canvasTextColor}" dominant-baseline="central">${stripEmoji(acc.name)}</text>
            </g>
            <text x="25" y="60" font-family="Arial, sans-serif" font-size="16" font-weight="700" fill="${aColor}" dominant-baseline="central">${acc.display_date}</text>
            <text x="25" y="75" font-family="Arial, sans-serif" font-size="15" fill="${isDarkBackground ? '#CBD5E0' : '#4A5568'}" dominant-baseline="central">${acc.description.substring(0, 80).replace(/[<>&"']/g, "")}...</text>
        </g>`).join('')}
    </g>

    <g transform="translate(520, 150)">
        <rect width="440" height="520" rx="40" fill="${isDarkBackground ? '#1A202C' : '#FFFFFF'}" />
        <path d="M 0 40 Q 0 0 40 0 L 400 0 Q 440 0 440 40 L 440 60 L 0 60 Z" fill="${aColor}" />
        <g transform="translate(30, 80)">
            ${generateSVGGrid(aColor, 54, 60, activityMap)}
        </g>
    </g>

    <g transform="translate(60, 780)">
        ${logoBase64 ? `<image width="140" height="40" href="data:image/png;base64,${logoBase64}" />` : ''}
        ${customTagline ? `<text x="880" y="30" font-family="Arial, sans-serif" font-size="20" font-style="italic" fill="${canvasSecondaryTextColor}" text-anchor="end">${customTagline}</text>` : ''}
    </g>
`;
        } else {
            svg += `
    <rect x="780" y="30" width="190" height="35" rx="12" fill="${pColor}" />
    <text x="875" y="53" font-family="Arial, sans-serif" font-size="13" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="2">HR CALENDAR</text>
    
    <text x="500" y="140" font-family="Arial, sans-serif" font-size="44" font-weight="900" fill="${canvasTextColor}" text-anchor="middle">${monthName.toUpperCase()}</text>
    <text x="500" y="180" font-family="Arial, sans-serif" font-size="20" font-weight="600" fill="${canvasSecondaryTextColor}" text-anchor="middle" letter-spacing="4">${yearNum}</text>

    <g transform="translate(100, 220)">
        ${generateSVGGrid(aColor, 115, 45, activityMap)}
    </g>

    <line x1="80" y1="520" x2="920" y2="520" stroke="${canvasBorderColor}" stroke-width="1.5" />

    <g transform="translate(100, 520)">
        ${sortedGroupedActivities.slice(0, 3).map((acc, i) => `
        <g transform="translate(${i * 300}, 0)">
            <text x="0" y="0" font-family="Arial, sans-serif" font-size="12" font-weight="800" fill="${aColor}" dominant-baseline="central">${acc.display_date}</text>
            <g transform="translate(0, 25)">
                ${customIconMap[acc.name] ? (
                    customIconMap[acc.name].startsWith('data:image') ?
                        `<image x="-10" y="-10" width="20" height="20" href="${customIconMap[acc.name]}" clip-path="url(#circleClip)" preserveAspectRatio="xMidYMid slice" />` :
                        `<text x="0" y="0" font-family="Arial, sans-serif" font-size="18" font-weight="800" fill="${canvasTextColor}" dominant-baseline="central">${customIconMap[acc.name]}</text>`
                ) : (
                    `<text x="0" y="0" font-family="Arial, sans-serif" font-size="18" font-weight="800" fill="${canvasTextColor}" dominant-baseline="central">${extractEmoji(acc.name) || ''}</text>`
                )}
                <text x="25" y="0" font-family="Arial, sans-serif" font-size="18" font-weight="800" fill="${canvasTextColor}" dominant-baseline="central">${stripEmoji(acc.name)}</text>
            </g>
        </g>`).join('')}
    </g>

    <g transform="translate(500, 770)">
        ${customTagline ? `<text x="0" y="0" font-family="Arial, sans-serif" font-size="14" font-weight="600" fill="${canvasSecondaryTextColor}" text-anchor="middle" letter-spacing="4">${customTagline.toUpperCase()}</text>` : ''}
        ${logoBase64 ? `<image x="-60" y="10" width="120" height="40" href="data:image/png;base64,${logoBase64}" />` : ''}
    </g>
`;
        }

        svg += '\n</svg>';
        return svg;
    };

    const generateSVGGrid = (accent: string, cellW: number, cellH: number, activityMap: { [key: number]: ActivityWithHistory[] }) => {
        const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
        const yearNum = currentDate.getFullYear();
        const monthNum = currentDate.getMonth();
        const daysInMonth = new Date(yearNum, monthNum + 1, 0).getDate();
        const startOffset = new Date(yearNum, monthNum, 1).getDay();
        const realOffset = startOffset === 0 ? 6 : startOffset - 1;

        let gridSvg = '';
        days.forEach((day, i) => {
            gridSvg += `<text x="${i * cellW + cellW / 2}" y="15" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#E53E3E" text-anchor="middle" dominant-baseline="central">${day}</text>`;
        });

        for (let i = 0; i < 42; i++) {
            const dayNum = i - realOffset + 1;
            const isCurrentMonth = dayNum > 0 && dayNum <= daysInMonth;
            const row = Math.floor(i / 7);
            const col = i % 7;

            if (isCurrentMonth) {
                const dayActivities = activityMap[dayNum];
                gridSvg += `
        <g transform="translate(${col * cellW}, ${row * cellH + 45})">
            ${dayActivities && dayActivities.length > 0 ? `
            <circle cx="${cellW / 2}" cy="${cellH / 2}" r="${cellH / 2.5}" fill="${canvasCardBg}" stroke="${canvasBorderColor}" stroke-width="1" />
            ${customIconMap[dayActivities[0].name] ? (
                            customIconMap[dayActivities[0].name].startsWith('data:image') ?
                                `<image x="${cellW / 2 - cellH / 2.5}" y="${cellH / 2 - cellH / 2.5}" width="${cellH / 1.25}" height="${cellH / 1.25}" href="${customIconMap[dayActivities[0].name]}" clip-path="url(#circleClip)" preserveAspectRatio="xMidYMid slice" />` :
                                `<text x="${cellW / 2}" y="${cellH / 2}" font-family="Arial, sans-serif" font-size="${cellH / 2.5}" text-anchor="middle" dominant-baseline="central" fill="${canvasTextColor}">${customIconMap[dayActivities[0].name]}</text>`
                        ) : (
                            `<text x="${cellW / 2}" y="${cellH / 2}" font-family="Arial, sans-serif" font-size="${cellH / 2.5}" text-anchor="middle" dominant-baseline="central" fill="${canvasTextColor}">${extractEmoji(dayActivities[0].name) || '⭐'}</text>`
                        )}
            ` : `
            <text x="${cellW / 2}" y="${cellH / 2}" font-family="Arial, sans-serif" font-size="16" font-weight="700" fill="${canvasTextColor}" text-anchor="middle" dominant-baseline="central">${dayNum}</text>
            `}
        </g>`;
            }
        }
        return gridSvg;
    };

    const handleThemeSelect = (theme: UITheme) => {
        setActiveTheme(theme);
    };

    // --- EMOJI HELPERS (RE-IMPLEMENTED) ---
    const extractEmoji = (text: string) => {
        // Simple but effective regex for emojis
        const match = text.match(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u);
        return match ? match[0] : null;
    };

    const stripEmoji = (text: string) => {
        return text.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "").trim();
    };

    const getIconForCategory = (category: string, activityName: string = '') => {
        const cat = category.toLowerCase();
        const name = activityName.toLowerCase();
        if (name.includes('foot') || name.includes('socc')) return 'soccer';
        if (name.includes('brick') || name.includes('crick')) return 'cricket';
        if (name.includes('yoga')) return 'yoga';
        if (name.includes('pizza')) return 'pizza';
        if (name.includes('drink') || name.includes('party')) return 'glass-cocktail';
        if (cat.includes('sport')) return 'soccer';
        if (cat.includes('well')) return 'leaf';
        if (cat.includes('team')) return 'account-group';
        if (cat.includes('learn') || cat.includes('brain')) return 'lightbulb';
        if (cat.includes('social')) return 'glass-cocktail';
        return 'star';
    };

    const sortedGroupedActivities = React.useMemo(() => {
        const map = new Map<string, ActivityWithHistory & { all_dates: string[], display_date?: string }>();
        activities.forEach(acc => {
            if (map.has(acc.name)) {
                map.get(acc.name)!.all_dates.push(acc.scheduled_date);
            } else {
                map.set(acc.name, { ...acc, all_dates: [acc.scheduled_date] });
            }
        });

        const grouped = Array.from(map.values()).map(acc => {
            acc.all_dates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
            if (acc.all_dates.length > 1) {
                const first = new Date(acc.all_dates[0]);
                const last = new Date(acc.all_dates[acc.all_dates.length - 1]);
                acc.display_date = `${first.getDate()}/${first.getMonth() + 1} - ${last.getDate()}/${last.getMonth() + 1}`;
            } else {
                const d = new Date(acc.scheduled_date);
                acc.display_date = `${d.getDate()}/${d.getMonth() + 1}`;
            }
            return acc;
        });

        return grouped.sort((a, b) => {
            if (a.all_dates.length > 1 && b.all_dates.length === 1) return -1;
            if (a.all_dates.length === 1 && b.all_dates.length > 1) return 1;
            return new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime();
        });
    }, [activities]);

    const monthName = currentDate.toLocaleString('default', { month: 'long' });
    const yearNum = currentDate.getFullYear();

    // --- REVERTED ORIGINAL CALENDAR GRID ---
    const renderCalendarGrid = (currentAccent: string) => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const startOffset = firstDay === 0 ? 6 : firstDay - 1;

        const activityMap: { [key: number]: ActivityWithHistory[] } = {};
        activities.forEach(acc => {
            const day = new Date(acc.scheduled_date).getDate();
            if (!activityMap[day]) activityMap[day] = [];
            activityMap[day].push(acc);
        });

        const dayLabels = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

        return (
            <View style={{ width: '100%', marginTop: 20 }}>
                <View style={{ flexDirection: 'row', marginBottom: 20 }}>
                    {dayLabels.map(d => (
                        <Text key={d} style={{ flex: 1, textAlign: 'center', fontSize: 14, fontWeight: '800', color: '#E53E3E' }}>{d}</Text>
                    ))}
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                    {Array.from({ length: 42 }).map((_, i) => {
                        const dayNum = i - startOffset + 1;
                        const isCurrentMonth = dayNum > 0 && dayNum <= daysInMonth;
                        const dayActivities = isCurrentMonth ? activityMap[dayNum] : null;

                        return (
                            <View key={i} style={{ width: '14.28%', height: 60, alignItems: 'center', justifyContent: 'center' }}>
                                {isCurrentMonth && (
                                    <>
                                        {dayActivities && dayActivities.length > 0 ? (
                                            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: canvasCardBg, borderWidth: 1, borderColor: canvasBorderColor, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                                {customIconMap[dayActivities[0].name] ? (
                                                    customIconMap[dayActivities[0].name].startsWith('data:image') ? (
                                                        <Image source={{ uri: customIconMap[dayActivities[0].name] }} style={{ width: 44, height: 44 }} resizeMode="cover" />
                                                    ) : (
                                                        <Text style={{ fontSize: 22, color: canvasTextColor }}>{customIconMap[dayActivities[0].name]}</Text>
                                                    )
                                                ) : extractEmoji(dayActivities[0].name) ? (
                                                    <Text style={{ fontSize: 22, color: canvasTextColor }}>{extractEmoji(dayActivities[0].name)}</Text>
                                                ) : (
                                                    <MaterialCommunityIcons name={getIconForCategory(dayActivities[0].category, dayActivities[0].name) as any} size={24} color={currentAccent} />
                                                )}
                                            </View>
                                        ) : (
                                            <Text style={{ fontSize: 16, fontWeight: '700', color: canvasTextColor }}>{dayNum}</Text>
                                        )}
                                    </>
                                )}
                            </View>
                        );
                    })}
                </View>
            </View>
        );
    };

    // LAYOUT 1: STRUCTURED PRO (FULLY REVERTED TO ORIGINAL WORKING VERSION)
    const renderStructuredLayout = () => {
        return (
            <View style={{ width: CANVAS_WIDTH, minHeight: 850, backgroundColor: bg, paddingBottom: 60 }}>
                <View style={{ backgroundColor: primaryColor, paddingVertical: 24, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#FFF', fontSize: 32, fontWeight: 'bold', letterSpacing: 1.5, textTransform: 'uppercase' }}>HR Calendar</Text>
                </View>

                <View style={{ flexDirection: 'row', width: '100%', padding: 40 }}>
                    <View style={{ width: '50%', borderRightWidth: 1.5, borderColor: '#E8ECF1', paddingRight: 40, alignItems: 'center' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 32, gap: 16 }}>
                            <View style={{ padding: 10, borderRadius: 12, borderWidth: 2, borderColor: primaryColor }}>
                                <MaterialCommunityIcons name="calendar-month" size={32} color={primaryColor} />
                            </View>
                            <Text style={{ fontSize: 34, fontWeight: '800', color: primaryColor }}>{monthName} {yearNum}</Text>
                        </View>

                        {renderCalendarGrid(accentColor)}

                        {customTagline ? (
                            <View style={{ marginTop: 60, width: '100%', paddingVertical: 20, paddingHorizontal: 24, borderRadius: 18, borderWidth: 2, borderColor: accentColor + '40', alignItems: 'center', justifyContent: 'center', backgroundColor: canvasCardBg }}>
                                <Text style={{ fontSize: 16, fontWeight: '600', color: canvasTextColor, textAlign: 'center' }}>{customTagline}</Text>
                            </View>
                        ) : null}
                    </View>

                    <View style={{ width: '50%', paddingLeft: 40 }}>
                        <Text style={{ fontSize: 38, fontWeight: '900', color: primaryColor, marginBottom: 30, textAlign: 'center' }}>Events</Text>
                        <View style={{ gap: 20 }}>
                            {sortedGroupedActivities.slice(0, 4).map((acc, i) => (
                                <TouchableOpacity
                                    key={i}
                                    onPress={() => handlePickCustomIcon(acc.name)}
                                    style={{ flexDirection: 'row', backgroundColor: canvasCardBg, borderRadius: 20, padding: 24, alignItems: 'flex-start', borderWidth: 1.5, borderColor: accentColor + '30', gap: 20 }}
                                >
                                    <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: accentColor + '10', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                                        {customIconMap[acc.name] ? (
                                            customIconMap[acc.name].startsWith('data:image') ? (
                                                <Image source={{ uri: customIconMap[acc.name] }} style={{ width: 60, height: 60 }} resizeMode="cover" />
                                            ) : (
                                                <Text style={{ fontSize: 24 }}>{customIconMap[acc.name]}</Text>
                                            )
                                        ) : extractEmoji(acc.name) ? (
                                            <Text style={{ fontSize: 24 }}>{extractEmoji(acc.name)}</Text>
                                        ) : (
                                            <MaterialCommunityIcons name={getIconForCategory(acc.category, acc.name) as any} size={24} color={accentColor} />
                                        )}
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                            <Text style={{ fontSize: 20, fontWeight: '800', color: canvasTextColor, flex: 1 }} numberOfLines={1}>{stripEmoji(acc.name)}</Text>
                                            <Text style={{ fontSize: 15, fontWeight: '800', color: accentColor }}>{acc.display_date}</Text>
                                        </View>
                                        <Text style={{ fontSize: 15, color: canvasSecondaryTextColor, lineHeight: 22 }}>{acc.description}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <View style={{ height: 40 }} />
                    </View>
                </View>

                {organization?.orgLogoUri && (
                    <View style={{ width: '100%', height: 100, justifyContent: 'center', alignItems: 'center', marginTop: 10, paddingBottom: 20 }}>
                        <Image source={{ uri: organization.orgLogoUri }} style={{ width: 180, height: 60 }} resizeMode="contain" />
                    </View>
                )}
            </View>
        );
    };

    // LAYOUT 2: MODERN PLAYFUL (ALIGNED)
    const renderPlayfulLayout = () => (
        <View style={{ width: CANVAS_WIDTH, minHeight: 900, backgroundColor: bg, padding: 60 }}>
            <View style={{ position: 'absolute', top: 60, left: 60, backgroundColor: primaryColor, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 }}>
                <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16, letterSpacing: 2 }}>HR CALENDAR</Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 40 }}>
                <View style={{ flex: 1, paddingRight: 60 }}>
                    <Text style={{ fontSize: 85, fontWeight: '900', color: primaryColor, letterSpacing: -2 }}>{monthName}</Text>
                    <Text style={{ fontSize: 36, fontWeight: '300', color: accentColor, marginTop: -20, letterSpacing: 10 }}>{yearNum}</Text>

                    <View style={{ marginTop: 60 }}>
                        {sortedGroupedActivities.slice(0, 5).map((acc, i) => (
                            <TouchableOpacity
                                key={i}
                                onPress={() => handlePickCustomIcon(acc.name)}
                                style={{ marginBottom: 30, borderLeftWidth: 8, borderColor: accentColor, paddingLeft: 25 }}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                    {customIconMap[acc.name] ? (
                                        customIconMap[acc.name].startsWith('data:image') ? (
                                            <Image source={{ uri: customIconMap[acc.name] }} style={{ width: 24, height: 24, borderRadius: 4 }} />
                                        ) : (
                                            <Text style={{ fontSize: 24 }}>{customIconMap[acc.name]}</Text>
                                        )
                                    ) : extractEmoji(acc.name) ? (
                                        <Text style={{ fontSize: 24 }}>{extractEmoji(acc.name)}</Text>
                                    ) : null}
                                    <Text style={{ fontSize: 24, fontWeight: '900', color: canvasTextColor }}>{stripEmoji(acc.name)}</Text>
                                </View>
                                <Text style={{ fontSize: 18, fontWeight: '700', color: accentColor, marginTop: 4 }}>{acc.display_date}</Text>
                                <Text style={{ fontSize: 16, color: canvasSecondaryTextColor, marginTop: 6, lineHeight: 22 }}>{acc.description}</Text>
                            </TouchableOpacity>
                        ))}
                        <View style={{ height: 40 }} />
                    </View>
                </View>

                <View style={{ width: 440 }}>
                    <View style={{ backgroundColor: canvasCardBg, borderRadius: 40, padding: 40, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 25, elevation: 15 }}>
                        <View style={{ height: 25, borderTopLeftRadius: 40, borderTopRightRadius: 40, backgroundColor: accentColor, position: 'absolute', top: 0, left: 0, right: 0 }} />
                        {renderCalendarGrid(accentColor)}
                    </View>
                </View>
            </View>

            <View style={{ position: 'absolute', bottom: 60, left: 60, right: 60, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                {customTagline && <Text style={{ fontSize: 20, color: canvasSecondaryTextColor, fontStyle: 'italic', fontWeight: '500' }}>{customTagline}</Text>}
                {organization?.orgLogoUri && <Image source={{ uri: organization.orgLogoUri }} style={{ width: 140, height: 40 }} resizeMode="contain" />}
            </View>
        </View>
    );

    // LAYOUT 3: ULTRA MINIMAL
    const renderMinimalLayout = () => (
        <View style={{ width: CANVAS_WIDTH, minHeight: 800, backgroundColor: bg, padding: 80, alignItems: 'center', paddingBottom: 60 }}>
            <View style={{ position: 'absolute', top: 30, right: 30, backgroundColor: primaryColor, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 }}>
                <Text style={{ fontSize: 13, fontWeight: '900', color: '#FFF', letterSpacing: 2 }}>HR CALENDAR</Text>
            </View>

            <View style={{ alignItems: 'center', marginTop: 20 }}>
                <Text style={{ fontSize: 44, fontWeight: '900', color: canvasTextColor }}>{monthName.toUpperCase()}</Text>
                <Text style={{ fontSize: 20, fontWeight: '600', color: canvasSecondaryTextColor, marginTop: -5, letterSpacing: 4 }}>{yearNum}</Text>
            </View>
            <View style={{ width: '80%' }}>
                {renderCalendarGrid(accentColor)}
            </View>
            <View style={{ width: '100%', height: 1.5, backgroundColor: '#F0F4F8', marginVertical: 20 }} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 40, justifyContent: 'center' }}>
                {sortedGroupedActivities.slice(0, 6).map((acc, i) => (
                    <TouchableOpacity
                        key={i}
                        onPress={() => handlePickCustomIcon(acc.name)}
                        style={{ width: '28%', marginBottom: 10 }}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                            <Text style={{ fontSize: 13, color: accentColor, fontWeight: '800' }}>{acc.display_date}</Text>
                            <View style={{ flex: 1, height: 1, backgroundColor: accentColor + '30' }} />
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            {customIconMap[acc.name] ? (
                                customIconMap[acc.name].startsWith('data:image') ? (
                                    <Image source={{ uri: customIconMap[acc.name] }} style={{ width: 16, height: 16, borderRadius: 8 }} resizeMode="cover" />
                                ) : (
                                    <Text style={{ fontSize: 16 }}>{customIconMap[acc.name]}</Text>
                                )
                            ) : extractEmoji(acc.name) ? (
                                <Text style={{ fontSize: 16 }}>{extractEmoji(acc.name)}</Text>
                            ) : null}
                            <Text style={{ fontSize: 18, fontWeight: '800', color: canvasTextColor }}>{stripEmoji(acc.name)}</Text>
                        </View>
                        <Text style={{ fontSize: 13, color: canvasSecondaryTextColor, marginTop: 4, lineHeight: 18 }}>{acc.description}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            <View style={{ marginTop: 'auto', alignItems: 'center', paddingTop: 80 }}>
                {customTagline && <Text style={{ color: canvasSecondaryTextColor, fontSize: 14, letterSpacing: 4, fontWeight: '600', marginBottom: 20 }}>{customTagline.toUpperCase()}</Text>}
                {organization?.orgLogoUri && <Image source={{ uri: organization.orgLogoUri }} style={{ width: 120, height: 40 }} resizeMode="contain" />}
            </View>
        </View>
    );

    const renderCanvasContent = () => {
        switch (activeTheme.layoutType) {
            case 'playful': return renderPlayfulLayout();
            case 'structured': return renderStructuredLayout();
            case 'minimal': return renderMinimalLayout();
            default: return renderStructuredLayout();
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    const monthTitle = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    const screenWidth = Dimensions.get('window').width;
    const previewScale = (screenWidth - 40) / CANVAS_WIDTH;
    const compactScale = previewScale; // Fill the container width fully

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>

                <View style={styles.headerTitleContainer}>
                    <TouchableOpacity onPress={handlePrevMonth} style={[styles.navBtn, { backgroundColor: theme.colors.surface }]}>
                        <Ionicons name="chevron-back" size={18} color={theme.colors.primary} />
                    </TouchableOpacity>
                    <Text style={[theme.typography.h4, { color: theme.colors.text, marginHorizontal: 15 }]}>{monthTitle}</Text>
                    <TouchableOpacity onPress={handleNextMonth} style={[styles.navBtn, { backgroundColor: theme.colors.surface }]}>
                        <Ionicons name="chevron-forward" size={18} color={theme.colors.primary} />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity onPress={handleExport} style={styles.exportBtn}>
                    <Ionicons name="share-outline" size={24} color={theme.colors.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Branding & Style Controls */}
                <View style={[styles.brandingBox, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                    <View style={styles.controlsRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Visual Template</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                {EXPORT_UI_THEMES.map((t) => (
                                    <TouchableOpacity
                                        key={t.id}
                                        style={[styles.styleBtn, { borderColor: activeTheme.id === t.id ? theme.colors.primary : theme.colors.border, backgroundColor: theme.colors.surface }]}
                                        onPress={() => handleThemeSelect(t)}
                                    >
                                        <Text style={[styles.styleBtnText, { color: activeTheme.id === t.id ? theme.colors.primary : theme.colors.text }]}>{t.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </View>

                    <View style={[styles.brandingToggleRow, { borderTopColor: theme.colors.border }]}>
                        <View style={{ flex: 1 }}>
                            <Text style={[theme.typography.h4, { color: theme.colors.text }]}>Use Branding Colors</Text>
                            <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>Apply your company's primary & secondary theme</Text>
                        </View>
                        <Switch
                            value={useBranding}
                            onValueChange={setUseBranding}
                            trackColor={{ false: '#CBD5E0', true: theme.colors.primary }}
                            thumbColor="#FFF"
                        />
                    </View>
                </View>

                <TextInput
                    style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, marginTop: 20 }]}
                    value={customTagline}
                    onChangeText={setCustomTagline}
                    placeholder="Custom footer / mission text..."
                    placeholderTextColor={theme.colors.textSecondary}
                />

                {/* --- LIVE PREVIEW --- */}
                <View style={styles.previewSection}>
                    <View style={styles.previewHeaderRow}>
                        <Text style={[theme.typography.h4, { color: theme.colors.text }]}>Live Preview</Text>
                        <TouchableOpacity onPress={() => setPreviewVisible(true)} style={[styles.zoomButton, { backgroundColor: theme.colors.primaryLight }]}>
                            <Ionicons name="expand" size={16} color={theme.colors.primary} />
                            <Text style={[styles.zoomText, { color: theme.colors.primary }]}> HIGH-RES VIEW</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.previewFrame, { height: (CANVAS_HEIGHT_DEFAULT * compactScale), justifyContent: 'center', alignItems: 'center' }]}>
                        <View style={{
                            width: CANVAS_WIDTH,
                            height: CANVAS_HEIGHT_DEFAULT,
                            position: 'absolute',
                            transform: [
                                { scale: compactScale }
                            ],
                        }}>
                            <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1.0 }}>
                                {renderCanvasContent()}
                            </ViewShot>
                        </View>
                    </View>
                </View>

                <TouchableOpacity onPress={handleExport} style={[styles.mainBtn, { backgroundColor: theme.colors.primary, marginTop: 50 }]}>
                    <Text style={styles.mainBtnText}>Finalize & Share Image</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={handleSVGExport}
                    style={[styles.secondaryBtn, { borderColor: theme.colors.primary, marginTop: 15 }]}
                >
                    <Ionicons name="download-outline" size={20} color={theme.colors.primary} style={{ marginRight: 8 }} />
                    <Text style={[styles.secondaryBtnText, { color: theme.colors.primary }]}>Download Editable SVG (for Figma)</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* HIGH-RES MODAL */}
            <Modal visible={previewVisible} transparent={true} animationType="fade">
                <View style={styles.modalBg}>
                    <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={[theme.typography.h2, { color: theme.colors.text }]}>High Resolution View</Text>
                                <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>Scroll to see all events</Text>
                            </View>
                            <TouchableOpacity onPress={() => setPreviewVisible(false)}>
                                <Ionicons name="close-circle" size={36} color="#CBD5E0" />
                            </TouchableOpacity>
                        </View>

                        <View style={[styles.modalScrollArea, { backgroundColor: theme.isDark ? '#0F172A' : '#F1F5F9' }]}>
                            <ScrollView horizontal>
                                <ScrollView showsVerticalScrollIndicator={true}>
                                    <View style={{ width: CANVAS_WIDTH, borderRadius: 20, overflow: 'hidden', backgroundColor: theme.isDark ? '#1E293B' : '#FFF' }}>
                                        {renderCanvasContent()}
                                    </View>
                                </ScrollView>
                            </ScrollView>
                        </View>

                        <TouchableOpacity onPress={handleExport} style={[styles.mainBtn, { backgroundColor: theme.colors.primary, marginTop: 25 }]}>
                            <Text style={styles.mainBtnText}>Download High-Res</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <StatusModal
                visible={statusVisible}
                type={statusType}
                title={statusTitle}
                message={statusMessage}
                onClose={() => setStatusVisible(false)}
                confirmLabel="Great!"
            />

            {/* Premium Icon/Emoji Picker Modal */}
            <Modal
                visible={pickerVisible}
                animationType="slide"
                transparent
                onRequestClose={() => setPickerVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[theme.typography.h3, { color: theme.colors.text }]}>Pick an Icon</Text>
                            <TouchableOpacity onPress={() => setPickerVisible(false)}>
                                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <Text style={[theme.typography.body2, { color: theme.colors.textSecondary, marginBottom: 20 }]}>
                            Select a premium sticker or upload your own image for "{editingActivityName}"
                        </Text>

                        <TouchableOpacity
                            style={[styles.uploadButton, { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary + '10' }]}
                            onPress={pickImageFromLibrary}
                        >
                            <Ionicons name="image-outline" size={24} color={theme.colors.primary} />
                            <Text style={[theme.typography.body1, { color: theme.colors.primary, marginLeft: 10, fontWeight: '600' }]}>
                                Upload Custom Image
                            </Text>
                        </TouchableOpacity>

                        <View style={styles.divider} />

                        <FlatList
                            data={['🎯', '🍕', '🎮', '💡', '🧘', '🎨', '🔥', '👟', '🍿', '🎸', '🧗', '🧁', '🏆', '💻', '🚲', '🌿', '🎤', '🎬', '🏸', '🍔', '🍦', '🎲', '🏖️', '⛰️', '🛶', '🎭', '🧶', '🪴']}
                            numColumns={4}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.emojiItem}
                                    onPress={() => handleEmojiSelect(item)}
                                >
                                    <Text style={{ fontSize: 32 }}>{item}</Text>
                                </TouchableOpacity>
                            )}
                            keyExtractor={item => item}
                            columnWrapperStyle={styles.emojiRow}
                        />
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 15,
        borderBottomWidth: 1,

    },
    headerTitleContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    navBtn: { padding: 8, borderRadius: 10 },
    backButton: { padding: 4 },
    exportBtn: { padding: 4 },
    scrollContent: { padding: 20 },
    brandingBox: { padding: 15, borderRadius: 20, borderWidth: 1 },
    controlsRow: { marginBottom: 15 },
    label: { fontSize: 11, fontWeight: 'bold', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
    styleBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14, borderWidth: 2, marginRight: 10 },
    styleBtnText: { fontWeight: 'bold', fontSize: 14 },
    brandingToggleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, paddingTop: 15, borderTopWidth: 1 },
    input: { height: 56, borderRadius: 16, borderWidth: 1.5, paddingHorizontal: 20, fontSize: 16 },
    previewSection: { marginTop: 30 },
    previewHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    zoomButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
    zoomText: { fontWeight: '900', fontSize: 11 },
    previewFrame: { borderRadius: 24, overflow: 'hidden', borderWidth: 1 },
    mainBtn: { paddingVertical: 20, borderRadius: 20, alignItems: 'center' },
    mainBtnText: { color: '#FFF', fontWeight: '900', fontSize: 18, letterSpacing: 1 },
    secondaryBtn: { paddingVertical: 16, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderStyle: 'dashed', flexDirection: 'row' },
    secondaryBtnText: { fontWeight: '800', fontSize: 15 },
    modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '96%', height: '88%', padding: 24, borderRadius: 36 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
    modalScrollArea: { flex: 1, borderRadius: 20, overflow: 'hidden', padding: 5 },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    divider: {
        height: 1,
        backgroundColor: '#E2E8F0',
        marginVertical: 20,
    },
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 2,
        borderStyle: 'dashed',
        justifyContent: 'center',
    },
    emojiRow: {
        justifyContent: 'space-between',
        paddingHorizontal: 10,
    },
    emojiItem: {
        width: 70,
        height: 70,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
});
