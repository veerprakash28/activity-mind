import { Platform, Linking } from 'react-native';
import Constants from 'expo-constants';

const GITHUB_REPO = 'veerprakash28/activity-mind';
const API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

export interface UpdateInfo {
    hasUpdate: boolean;
    latestVersion: string;
    currentVersion: string;
    releaseNotes: string;
    downloadUrl: string;
}

export const VersionService = {
    /**
     * Gets the current version from app config
     */
    getCurrentVersion: (): string => {
        return Constants.expoConfig?.version || '1.0.0';
    },

    /**
     * Checks GitHub for a newer release
     */
    checkForUpdates: async (): Promise<UpdateInfo | null> => {
        try {
            const currentVersion = VersionService.getCurrentVersion();

            const response = await fetch(API_URL, {
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'ActivityMind-App'
                }
            });

            if (!response.ok) {
                console.warn('Failed to fetch latest release from GitHub');
                return null;
            }

            const data = await response.json();
            const latestVersion = data.tag_name.replace('v', '');
            const releaseNotes = data.body || '';
            const downloadUrl = data.html_url;

            // Simple semantic version comparison (major.minor.patch)
            const hasUpdate = VersionService.compareVersions(currentVersion, latestVersion) < 0;

            return {
                hasUpdate,
                latestVersion,
                currentVersion,
                releaseNotes,
                downloadUrl
            };
        } catch (error) {
            console.error('Update check failed:', error);
            return null;
        }
    },

    /**
     * Compare version strings
     * Returns:
     *  < 0 if v1 < v2
     *  0 if v1 == v2
     *  > 0 if v1 > v2
     */
    compareVersions: (v1: string, v2: string): number => {
        const parts1 = v1.split('.').map(Number);
        const parts2 = v2.split('.').map(Number);

        for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
            const p1 = parts1[i] || 0;
            const p2 = parts2[i] || 0;
            if (p1 < p2) return -1;
            if (p1 > p2) return 1;
        }
        return 0;
    },

    /**
     * Opens the browser to the download page
     */
    openDownloadPage: async (url: string) => {
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
            await Linking.openURL(url);
        }
    }
};
