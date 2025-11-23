'use client';
import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface GameLaunchModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: string;
  gameName: string;
}

export default function GameLaunchModal({ isOpen, onClose, gameId, gameName }: GameLaunchModalProps) {
  const [gameUrl, setGameUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && gameId) {
      launchGame();
    } else {
      // Reset state when modal closes
      setGameUrl(null);
      setError(null);
    }
  }, [isOpen, gameId]);

  const launchGame = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { pragmaticApi } = await import('@/lib/api');
      const response = await pragmaticApi.launchGame(gameId, {
        currency: 'USD',
        language: 'en',
        country: 'US',
        platform: 'WEB'
      });

      setGameUrl(response.gameUrl);
    } catch (err: any) {
      console.error('Error launching game:', err);
      setError(err.message || 'Failed to launch game. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-full h-[90vh] p-0 bg-gray-900 border-gray-800">
        <DialogHeader className="px-6 py-4 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-white text-xl font-bold">{gameName}</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 relative bg-black">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div className="text-center">
                <LoadingSpinner size="lg" />
                <p className="text-gray-400 mt-4">Loading game...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div className="text-center max-w-md px-6">
                <p className="text-red-400 text-lg mb-4">{error}</p>
                <Button onClick={launchGame} className="bg-green-500 hover:bg-green-600">
                  Try Again
                </Button>
              </div>
            </div>
          )}

          {gameUrl && !isLoading && !error && (
            <iframe
              src={gameUrl}
              className="w-full h-full border-0"
              allow="payment; fullscreen; autoplay; encrypted-media"
              allowFullScreen
              title={gameName}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}


