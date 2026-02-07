import { toast } from 'sonner';

export const downloadFile = async (url: string, fileName: string) => {
  try {
    toast.info('Se descarcă...');
    const response = await fetch(url);
    if (!response.ok) throw new Error('Download failed');
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(objectUrl);
  } catch (error) {
    console.error('Download error:', error);
    toast.error('Eroare la descărcare. Încearcă să deschizi în tab nou.');
    window.open(url, '_blank');
  }
};
