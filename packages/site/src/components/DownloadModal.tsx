import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface DownloadAsset {
  name: string;
  url: string;
  size: number;
}

interface DownloadOption {
  label: string;
  description: string;
  icon: string;
  fileExtension: string;
}

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: DownloadAsset[];
  mode: 'linux' | 'all';
}

const LINUX_OPTIONS: DownloadOption[] = [
  {
    label: 'AppImage',
    description: 'Universal Linux binary (no installation required)',
    icon: '📦',
    fileExtension: '.AppImage',
  },
  {
    label: 'Debian (.deb)',
    description: 'For Debian/Ubuntu-based systems',
    icon: '🐧',
    fileExtension: '.deb',
  },
  {
    label: 'RPM (.rpm)',
    description: 'For Fedora/RHEL-based systems',
    icon: '🎩',
    fileExtension: '.rpm',
  },
];

const ALL_OPTIONS: DownloadOption[] = [
  {
    label: 'Windows Installer',
    description: 'For Windows 10/11',
    icon: '🪟',
    fileExtension: '.msi',
  },
  {
    label: 'macOS Image',
    description: 'For macOS 10.15+',
    icon: '🍎',
    fileExtension: '.dmg',
  },
  ...LINUX_OPTIONS,
];

export default function DownloadModal({
  isOpen,
  onClose,
  assets,
  mode,
}: DownloadModalProps) {
  const options = mode === 'linux' ? LINUX_OPTIONS : ALL_OPTIONS;

  const findAsset = (fileExtension: string): DownloadAsset | undefined => {
    return assets.find((asset) => asset.name.endsWith(fileExtension));
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleDownload = (url: string) => {
    window.location.href = url;
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'linux' ? 'Choose Your Linux Format' : 'Choose Your Platform'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'linux'
              ? 'Select the package format that works best for your Linux distribution.'
              : 'Select the installer for your operating system.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-4">
          {options.map((option) => {
            const asset = findAsset(option.fileExtension);
            if (!asset) return null;

            return (
              <Button
                key={option.fileExtension}
                variant="outline"
                className="h-auto p-4 justify-start text-left"
                onClick={() => handleDownload(asset.url)}
              >
                <div className="flex items-start gap-3 w-full">
                  <span className="text-2xl flex-shrink-0">{option.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">{option.label}</div>
                    <div className="text-sm text-muted-foreground">
                      {option.description}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatBytes(asset.size)}
                    </div>
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
        <div className="text-center pt-2 border-t">
          <p className="text-sm text-muted-foreground">
            Or{' '}
            <a
              href="https://github.com/luis-c465/mdx-desktop/releases/latest"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              view all releases on GitHub
            </a>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
