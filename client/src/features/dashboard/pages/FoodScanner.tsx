import { useState, useRef } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload } from 'lucide-react';

export function FoodScanner() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex min-h-screen" style={{ background: '#F7F9F9' }}>
      <Sidebar />

      <main className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-[800px] flex flex-col items-center">
          {/* Upload Area */}
          <Card
            className="w-full mb-8 flex items-center justify-center cursor-pointer hover:border-[#00856F] transition-colors"
            style={{
              background: '#FFFFFF',
              border: '2px dashed rgba(0, 0, 0, 0.1)',
              borderRadius: '24px',
              minHeight: '400px',
              padding: '48px',
            }}
            onClick={handleUploadClick}
            data-testid="card-upload-area"
          >
            {previewUrl ? (
              <div className="flex flex-col items-center gap-4">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-w-full max-h-[300px] object-contain rounded-lg"
                  data-testid="img-preview"
                />
                <p
                  style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#546E7A',
                  }}
                  data-testid="text-file-name"
                >
                  {selectedFile?.name}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div
                  className="flex items-center justify-center rounded-full"
                  style={{
                    width: '120px',
                    height: '120px',
                    background: '#F7F9F9',
                  }}
                  data-testid="icon-upload-container"
                >
                  <Upload size={48} color="#00856F" strokeWidth={2} />
                </div>
                <p
                  style={{
                    fontSize: '16px',
                    fontWeight: 500,
                    color: '#546E7A',
                  }}
                  data-testid="text-upload-instruction"
                >
                  Click to upload a food picture
                </p>
              </div>
            )}
          </Card>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            data-testid="input-file"
          />

          {/* Upload Button */}
          <Button
            onClick={handleUploadClick}
            className="w-full max-w-[400px]"
            style={{
              background: '#00856F',
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: '16px',
              padding: '16px 32px',
              borderRadius: '8px',
              height: 'auto',
            }}
            data-testid="button-upload-picture"
          >
            Upload Picture
          </Button>
        </div>
      </main>
    </div>
  );
}
