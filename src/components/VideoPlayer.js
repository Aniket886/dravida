import { useState, useRef, useEffect } from 'react';
import styles from '../styles/VideoPlayer.module.css';

/**
 * Multi-source Video Player Component
 * Supports: YouTube (unlisted), Vimeo, Google Drive, and self-hosted videos
 * 
 * Usage:
 * <VideoPlayer 
 *   type="youtube" // 'youtube', 'vimeo', 'gdrive', 'self'
 *   videoId="dQw4w9WgXcQ" // YouTube/Vimeo ID or full URL for gdrive/self
 *   title="Lesson Title"
 *   onProgress={(time) => console.log('Progress:', time)}
 *   onComplete={() => console.log('Video completed')}
 * />
 */

export default function VideoPlayer({
    type = 'youtube',
    videoId,
    videoUrl,
    title = 'Video Lesson',
    onProgress,
    onComplete,
    autoplay = false
}) {
    const videoRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [error, setError] = useState(null);

    // Extract video ID from URL if needed
    const getYouTubeId = (url) => {
        if (!url) return videoId;
        const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
        return match ? match[1] : url;
    };

    const getVimeoId = (url) => {
        if (!url) return videoId;
        const match = url.match(/(?:vimeo\.com\/)(\d+)/);
        return match ? match[1] : url;
    };

    const getGoogleDriveId = (url) => {
        if (!url) return videoId;
        const match = url.match(/[-\w]{25,}/);
        return match ? match[0] : url;
    };

    // Render YouTube Player
    const renderYouTube = () => {
        const ytId = getYouTubeId(videoUrl || videoId);
        if (!ytId) return <div className={styles.error}>No YouTube video ID provided</div>;

        return (
            <iframe
                className={styles.videoFrame}
                src={`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1&autoplay=${autoplay ? 1 : 0}&enablejsapi=1`}
                title={title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
            />
        );
    };

    // Render Vimeo Player
    const renderVimeo = () => {
        const vimeoId = getVimeoId(videoUrl || videoId);
        if (!vimeoId) return <div className={styles.error}>No Vimeo video ID provided</div>;

        return (
            <iframe
                className={styles.videoFrame}
                src={`https://player.vimeo.com/video/${vimeoId}?autoplay=${autoplay ? 1 : 0}&title=0&byline=0&portrait=0`}
                title={title}
                frameBorder="0"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
            />
        );
    };

    // Render Google Drive Player
    const renderGoogleDrive = () => {
        const driveId = getGoogleDriveId(videoUrl || videoId);
        if (!driveId) return <div className={styles.error}>No Google Drive file ID provided</div>;

        return (
            <iframe
                className={styles.videoFrame}
                src={`https://drive.google.com/file/d/${driveId}/preview`}
                title={title}
                frameBorder="0"
                allow="autoplay; fullscreen"
                allowFullScreen
            />
        );
    };

    // Render Self-hosted HTML5 Video Player
    const renderSelfHosted = () => {
        const url = videoUrl || videoId;
        if (!url) return <div className={styles.error}>No video URL provided</div>;

        const handleTimeUpdate = () => {
            if (videoRef.current) {
                setCurrentTime(videoRef.current.currentTime);
                if (onProgress) {
                    onProgress(videoRef.current.currentTime);
                }
            }
        };

        const handleEnded = () => {
            setIsPlaying(false);
            if (onComplete) {
                onComplete();
            }
        };

        const handleLoadedMetadata = () => {
            if (videoRef.current) {
                setDuration(videoRef.current.duration);
            }
        };

        const togglePlay = () => {
            if (videoRef.current) {
                if (isPlaying) {
                    videoRef.current.pause();
                } else {
                    videoRef.current.play();
                }
                setIsPlaying(!isPlaying);
            }
        };

        const handleSeek = (e) => {
            if (videoRef.current) {
                const rect = e.target.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const percent = x / rect.width;
                videoRef.current.currentTime = percent * duration;
            }
        };

        const handleVolumeChange = (e) => {
            const newVolume = parseFloat(e.target.value);
            setVolume(newVolume);
            if (videoRef.current) {
                videoRef.current.volume = newVolume;
            }
        };

        const toggleFullscreen = () => {
            if (!document.fullscreenElement) {
                videoRef.current?.parentElement?.requestFullscreen();
                setIsFullscreen(true);
            } else {
                document.exitFullscreen();
                setIsFullscreen(false);
            }
        };

        const formatTime = (seconds) => {
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        };

        return (
            <div className={styles.html5Player}>
                <video
                    ref={videoRef}
                    className={styles.videoElement}
                    src={url}
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={handleEnded}
                    onLoadedMetadata={handleLoadedMetadata}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onError={() => setError('Failed to load video')}
                    autoPlay={autoplay}
                    playsInline
                />

                {/* Custom Controls */}
                <div className={styles.controls}>
                    <button className={styles.playBtn} onClick={togglePlay}>
                        {isPlaying ? '⏸️' : '▶️'}
                    </button>

                    <div className={styles.progress} onClick={handleSeek}>
                        <div
                            className={styles.progressFill}
                            style={{ width: `${(currentTime / duration) * 100}%` }}
                        />
                    </div>

                    <span className={styles.time}>
                        {formatTime(currentTime)} / {formatTime(duration)}
                    </span>

                    <div className={styles.volumeControl}>
                        <span>🔊</span>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={volume}
                            onChange={handleVolumeChange}
                            className={styles.volumeSlider}
                        />
                    </div>

                    <button className={styles.fullscreenBtn} onClick={toggleFullscreen}>
                        {isFullscreen ? '⛶' : '⛶'}
                    </button>
                </div>
            </div>
        );
    };

    // Render placeholder if no video
    const renderPlaceholder = () => (
        <div className={styles.placeholder}>
            <span className={styles.placeholderIcon}>🎬</span>
            <h3>{title}</h3>
            <p>Video content will be available soon</p>
        </div>
    );

    // Main render logic
    const renderPlayer = () => {
        if (error) {
            return <div className={styles.error}>{error}</div>;
        }

        if (!videoId && !videoUrl) {
            return renderPlaceholder();
        }

        switch (type.toLowerCase()) {
            case 'youtube':
                return renderYouTube();
            case 'vimeo':
                return renderVimeo();
            case 'gdrive':
            case 'googledrive':
            case 'drive':
                return renderGoogleDrive();
            case 'self':
            case 'mp4':
            case 'hosted':
            case 'url':
                return renderSelfHosted();
            default:
                return renderYouTube();
        }
    };

    return (
        <div className={styles.videoContainer}>
            {renderPlayer()}
        </div>
    );
}

// Helper to detect video type from URL
export function detectVideoType(url) {
    if (!url) return null;

    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        return 'youtube';
    }
    if (url.includes('vimeo.com')) {
        return 'vimeo';
    }
    if (url.includes('drive.google.com')) {
        return 'gdrive';
    }
    if (url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.ogg')) {
        return 'self';
    }

    return 'youtube'; // Default
}
