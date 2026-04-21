import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';

export async function POST() {
  // Sadece lokal ortamda çalıştır (Güvenlik için)
  if (process.env.NODE_ENV !== 'development' && !process.env.ALLOW_REMOTE_SYNC) {
    return NextResponse.json({ error: 'Sync only allowed in development mode' }, { status: 403 });
  }

  return new Promise((resolve) => {
    const scriptPath = path.join(process.cwd(), 'tefas-api', 'sync_job.py');
    
    console.log('[Sync API] Tetikleniyor:', scriptPath);

    // Python scriptini çalıştır
    exec(`python "${scriptPath}"`, (error, stdout, stderr) => {
      if (error) {
        console.error(`[Sync API] Hata: ${error.message}`);
        resolve(NextResponse.json({ error: error.message, details: stderr }, { status: 500 }));
        return;
      }
      
      console.log(`[Sync API] Çıktı: ${stdout}`);
      resolve(NextResponse.json({ 
        message: 'Sync completed successfully', 
        output: stdout.split('\n').filter(line => line.trim()) 
      }));
    });
  });
}
