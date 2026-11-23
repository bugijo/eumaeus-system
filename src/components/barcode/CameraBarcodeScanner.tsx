import { useEffect, useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Props {
  open: boolean;
  onClose: () => void;
  onDetected: (code: string) => void;
  /** Mantém a câmera aberta após cada leitura (modo caixa). */
  continuous?: boolean;
}

const FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'itf', 'qr_code'];

/**
 * Lê códigos de barras pela câmera. Usa o BarcodeDetector nativo (Chrome/Android) quando existe
 * e cai para o ZXing (carregado sob demanda) nos demais navegadores, inclusive iOS.
 */
export function CameraBarcodeScanner({ open, onClose, onDetected, continuous = false }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [last, setLast] = useState<string | null>(null);
  const onDetectedRef = useRef(onDetected);
  onDetectedRef.current = onDetected;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    let stopped = false;
    let stream: MediaStream | null = null;
    let zxingControls: { stop: () => void } | null = null;
    let lastCode = '';
    let lastAt = 0;

    const emit = (code: string) => {
      const now = Date.now();
      if (code === lastCode && now - lastAt < 1500) return; // evita leitura duplicada do mesmo item
      lastCode = code;
      lastAt = now;
      setLast(code);
      if (navigator.vibrate) navigator.vibrate(60);
      onDetectedRef.current(code);
      if (!continuous) onCloseRef.current();
    };

    const start = async () => {
      setError(null);
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Este navegador não permite acesso à câmera. Use um leitor USB ou digite o código.');
        return;
      }
      try {
        const Detector = (window as any).BarcodeDetector;
        const supported: string[] = Detector?.getSupportedFormats ? await Detector.getSupportedFormats() : [];
        if (Detector && supported.some((format) => FORMATS.includes(format))) {
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
          if (stopped || !videoRef.current) return;
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          const detector = new Detector({ formats: FORMATS.filter((format) => supported.includes(format)) });
          const tick = async () => {
            if (stopped || !videoRef.current) return;
            try {
              const codes = await detector.detect(videoRef.current);
              if (codes?.[0]?.rawValue) emit(String(codes[0].rawValue));
            } catch { /* frame sem código */ }
            if (!stopped) setTimeout(tick, 150);
          };
          tick();
          return;
        }
        const { BrowserMultiFormatReader } = await import('@zxing/browser');
        if (stopped || !videoRef.current) return;
        const reader = new BrowserMultiFormatReader();
        zxingControls = await reader.decodeFromConstraints({ video: { facingMode: 'environment' } }, videoRef.current, (result) => {
          if (result && !stopped) emit(result.getText());
        });
      } catch (err) {
        const name = (err as Error)?.name;
        setError(name === 'NotAllowedError' ? 'Permissão da câmera negada. Libere a câmera nas configurações do navegador.' : 'Não foi possível abrir a câmera.');
      }
    };

    start();
    return () => {
      stopped = true;
      zxingControls?.stop();
      stream?.getTracks().forEach((track) => track.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [open, continuous]);

  return (
    <Dialog open={open} onOpenChange={(value) => { if (!value) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Camera className="h-5 w-5" /> Ler código de barras</DialogTitle>
          <DialogDescription>Aponte a câmera para o código. {continuous ? 'Cada leitura entra no carrinho.' : ''}</DialogDescription>
        </DialogHeader>
        <div className="relative overflow-hidden rounded-lg bg-black aspect-[4/3]">
          <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
          <div className="pointer-events-none absolute inset-x-8 top-1/2 h-0.5 -translate-y-1/2 bg-red-500/80 shadow-[0_0_12px_rgba(239,68,68,0.9)]" />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {last && !error && <p className="text-sm text-muted-foreground">Último código lido: <span className="font-mono">{last}</span></p>}
        <Button variant="outline" onClick={onClose}><X className="mr-2 h-4 w-4" /> Fechar câmera</Button>
      </DialogContent>
    </Dialog>
  );
}

export default CameraBarcodeScanner;
