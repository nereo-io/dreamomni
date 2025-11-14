/**
 * AssetModal
 * Unified modal for displaying asset details (script, image, video)
 * Uses shadcn Dialog component with keyboard navigation support
 */

"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

type AssetType = 'script' | 'image' | 'video';

interface AssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: AssetType;
  data: {
    url?: string;
    content?: string;
    title?: string;
    shotNumber?: number;
  };
}

export function AssetModal({ isOpen, onClose, type, data }: AssetModalProps) {
  const [isCopied, setIsCopied] = useState(false);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      // ESC key is handled by Dialog component
      // Add space key for video pause/play
      if (type === 'video' && e.code === 'Space') {
        e.preventDefault();
        const video = document.querySelector('video');
        if (video) {
          if (video.paused) {
            video.play();
          } else {
            video.pause();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, type]);

  const handleCopy = async () => {
    if (data.content) {
      try {
        await navigator.clipboard.writeText(data.content);
        setIsCopied(true);
        toast.success('Copied to clipboard');
        setTimeout(() => setIsCopied(false), 2000);
      } catch (error) {
        toast.error('Failed to copy');
      }
    }
  };

  const handleDownload = () => {
    if (data.url) {
      const link = document.createElement('a');
      link.href = data.url;
      const ext = type === 'video' ? 'mp4' : type === 'image' ? 'png' : 'txt';
      link.download = `${type}_${data.shotNumber || 'asset'}.${ext}`;
      link.click();
    }
  };

  const getTitle = () => {
    if (data.title) return data.title;
    if (data.shotNumber) return `Shot #${data.shotNumber} ${type}`;
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden bg-gray-800 border-gray-700 text-gray-200">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-gray-100">{getTitle()}</DialogTitle>
            <div className="flex items-center gap-2">
              {type === 'script' && data.content && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  {isCopied ? 'Copied!' : 'Copy'}
                </Button>
              )}
              {data.url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="mt-4 overflow-auto max-h-[calc(90vh-120px)]">
          {/* Script */}
          {type === 'script' && data.content && (
            <pre className="bg-gray-900 rounded-lg p-4 text-sm text-gray-300 font-mono whitespace-pre-wrap line-height-relaxed">
              {data.content}
            </pre>
          )}

          {/* Image */}
          {type === 'image' && data.url && (
            <div className="flex items-center justify-center bg-gray-900 rounded-lg p-4">
              <img
                src={data.url}
                alt={getTitle()}
                className="max-w-full max-h-[70vh] object-contain rounded"
              />
            </div>
          )}

          {/* Video */}
          {type === 'video' && data.url && (
            <div className="bg-gray-900 rounded-lg overflow-hidden">
              <video
                src={data.url}
                controls
                autoPlay
                className="w-full max-h-[70vh]"
                preload="auto"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          )}
        </div>

        {/* Hint for keyboard shortcuts */}
        {type === 'video' && (
          <div className="text-xs text-gray-500 text-center mt-2">
            Press Space to pause/play • ESC to close
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
