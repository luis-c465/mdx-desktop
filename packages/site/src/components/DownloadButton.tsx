import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import DownloadModal from './DownloadModal';

interface DownloadAsset {
  name: string;
  url: string;
  size: number;
}

interface Release {
  tag_name: string;
  assets: DownloadAsset[];
}

type OS = 'windows' | 'macos' | 'linux' | 'unknown';

const CACHE_KEY = 'mdx-desktop-release';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export default function DownloadButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'linux' | 'all'>('all');
  const [release, setRelease] = useState<Release | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detectOS = (): OS => {
    if (typeof window === 'undefined') return 'unknown';

    const platform = navigator.platform.toLowerCase();
    const userAgent = navigator.userAgent.toLowerCase();

    if (platform.includes('win') || userAgent.includes('win')) return 'windows';
    if (platform.includes('mac') || userAgent.includes('mac')) return 'macos';
    if (platform.includes('linux') || userAgent.includes('linux')) return 'linux';
    return 'unknown';
  };

  const getCachedRelease = (): Release | null => {
    if (typeof window === 'undefined') return null;

    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp > CACHE_DURATION) {
        sessionStorage.removeItem(CACHE_KEY);
        return null;
      }

      return data;
    } catch {
      return null;
    }
  };

  const setCachedRelease = (data: Release) => {
    if (typeof window === 'undefined') return;

    try {
      sessionStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ data, timestamp: Date.now() })
      );
    } catch (e) {
      console.warn('Failed to cache release data:', e);
    }
  };

  const fetchLatestRelease = async (): Promise<Release | null> => {
    const cached = getCachedRelease();
    if (cached) return cached;

    try {
      const response = await fetch(
        'https://api.github.com/repos/luis-c465/mdx-desktop/releases/latest'
      );

      if (!response.ok) {
        throw new Error(`GitHub API returned ${response.status}`);
      }

      const data = await response.json();
      const release: Release = {
        tag_name: data.tag_name,
        assets: data.assets.map((asset: any) => ({
          name: asset.name,
          url: asset.browser_download_url,
          size: asset.size,
        })),
      };

      setCachedRelease(release);
      return release;
    } catch (err) {
      console.error('Failed to fetch release:', err);
      return null;
    }
  };

  const findAsset = (
    assets: DownloadAsset[],
    extension: string
  ): DownloadAsset | undefined => {
    return assets.find((asset) => asset.name.endsWith(extension));
  };

  const handleDownloadClick = async () => {
    setLoading(true);
    setError(null);

    const releaseData = await fetchLatestRelease();

    if (!releaseData) {
      setError('Unable to fetch latest release');
      setLoading(false);
      // Fallback to GitHub
      window.location.href = 'https://github.com/luis-c465/mdx-desktop/releases/latest';
      return;
    }

    setRelease(releaseData);

    const os = detectOS();
    const { assets } = releaseData;

    if (os === 'windows') {
      const msi = findAsset(assets, '.msi');
      if (msi) {
        window.location.href = msi.url;
        setLoading(false);
      } else {
        setModalMode('all');
        setIsModalOpen(true);
        setLoading(false);
      }
    } else if (os === 'macos') {
      const dmg = findAsset(assets, '.dmg');
      if (dmg) {
        window.location.href = dmg.url;
        setLoading(false);
      } else {
        setModalMode('all');
        setIsModalOpen(true);
        setLoading(false);
      }
    } else if (os === 'linux') {
      setModalMode('linux');
      setIsModalOpen(true);
      setLoading(false);
    } else {
      setModalMode('all');
      setIsModalOpen(true);
      setLoading(false);
    }
  };

  // Prefetch release data on mount
  useEffect(() => {
    fetchLatestRelease().then((data) => {
      if (data) setRelease(data);
    });
  }, []);

  return (
    <>
      <Button
        size="lg"
        onClick={handleDownloadClick}
        disabled={loading}
        variant="secondary"
        className="gap-2 "
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        {loading ? 'Loading...' : 'Download Now'}
        {release && !loading && (
          <span className="text-xs opacity-80 ml-1">{release.tag_name}</span>
        )}
      </Button>
      {error && (
        <p className="text-sm text-red-500 mt-2">
          {error}.{' '}
          <a
            href="https://github.com/luis-c465/mdx-desktop/releases/latest"
            className="underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Visit GitHub
          </a>
        </p>
      )}
      {release && (
        <DownloadModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          assets={release.assets}
          mode={modalMode}
        />
      )}
    </>
  );
}
