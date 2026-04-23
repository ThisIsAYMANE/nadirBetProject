'use client';
import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { casinoApi } from '@/lib/casinoApi';
import { useMediaQuery } from '@/hooks/useMediaQuery';

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

  // Detect device type for game launch
  const isMobile = useMediaQuery('(max-width: 768px)');

  const launchGame = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if user is logged in
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        // Trigger login modal
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('openLoginModal'));
        }
        setError('You must be logged in to play games');
        setIsLoading(false);
        return;
      }

      // Launch game with device detection
      const response = await casinoApi.launchGame(gameId, {
        device: isMobile ? 'mobile' : 'desktop',
        language: 'en',
        returnUrl: typeof window !== 'undefined' ? window.location.origin + '/casino' : undefined,
      });

      if (response.url) {
        setGameUrl(response.url);
      } else {
        throw new Error('No game URL returned from server');
      }
    } catch (err) {
      console.error('Error launching game:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to launch game. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && gameId) {
      launchGame();
    } else {
      // Reset state when modal closes
      setGameUrl(null);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, gameId]);

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

        <div className="flex-1 relative bg-black min-h-[500px]">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
              <div className="text-center">
                <LoadingSpinner size="lg" />
                <p className="text-gray-400 mt-4">Loading game...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
              <div className="text-center max-w-md px-6">
                <p className="text-red-400 text-lg mb-4">{error}</p>
                <div className="flex gap-3 justify-center">
                  <Button onClick={launchGame} className="bg-green-500 hover:bg-green-600">
                    Try Again
                  </Button>
                  <Button onClick={onClose} variant="outline">
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}

          {gameUrl && !isLoading && !error && (
            <iframe
              src={gameUrl}
              className="w-full h-full border-0 absolute inset-0"
              allow="payment; fullscreen; autoplay; encrypted-media; microphone; camera"
              allowFullScreen
              title={gameName}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}


