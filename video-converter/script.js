const { createFFmpeg, fetchFile } = FFmpeg;

// Create FFmpeg instance
const ffmpeg = createFFmpeg({
    log: true,
    progress: ({ ratio }) => {
        const progressBar = document.querySelector('.progress-fill');
        const progressText = document.querySelector('.progress-text');
        const percent = (ratio * 100).toFixed(0);
        progressBar.style.width = percent + '%';
        progressText.textContent = percent + '%';
    }
});

// Load FFmpeg
(async function() {
    try {
        await ffmpeg.load();
        console.log('FFmpeg is ready!');
    } catch (err) {
        console.error('FFmpeg loading failed:', err);
        document.getElementById('status').innerHTML = 
            'Error: FFmpeg failed to load. Please ensure your browser supports WebAssembly.';
    }
})();

document.getElementById('convertBtn').addEventListener('click', async () => {
    const videoFile = document.getElementById('videoFile').files[0];
    if (!videoFile) {
        alert('Please select a video file first!');
        return;
    }

    // Show progress bar
    document.querySelector('.progress').hidden = false;
    const convertBtn = document.getElementById('convertBtn');
    convertBtn.disabled = true;
    
    try {
        // Read the file
        const inputName = 'input' + videoFile.name.substring(videoFile.name.lastIndexOf('.'));
        const outputName = 'output.avi';
        
        // Write file to FFmpeg's virtual filesystem
        ffmpeg.FS('writeFile', inputName, await fetchFile(videoFile));
        
        // Status update
        document.getElementById('status').textContent = 'Converting...';
        
        // Run FFmpeg command
        await ffmpeg.run(
            '-i', inputName,
            '-c:v', 'libx264',  // Video codec
            '-c:a', 'aac',      // Audio codec
            outputName
        );
        
        // Read the result
        const data = ffmpeg.FS('readFile', outputName);
        
        // Create download link
        const blob = new Blob([data.buffer], { type: 'video/avi' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'converted.avi';
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        ffmpeg.FS('unlink', inputName);
        ffmpeg.FS('unlink', outputName);
        
        document.getElementById('status').textContent = 'Conversion complete!';
    } catch (error) {
        console.error('Conversion error:', error);
        document.getElementById('status').textContent = 'Error during conversion: ' + error.message;
    } finally {
        convertBtn.disabled = false;
    }
});