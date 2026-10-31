// Real WebRTC Peer-to-Peer Connection Manager
export interface WebRTCConfig {
  iceServers?: RTCIceServer[];
}

export const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
];

export class WebRTCManager {
  public peerConnection: RTCPeerConnection | null = null;
  public localStream: MediaStream | null = null;
  public remoteStream: MediaStream | null = null;
  public isAvatarMode: boolean = false;
  private avatarAnimationId: number | null = null;
  private onRemoteStreamCallback: ((stream: MediaStream) => void) | null = null;
  private onConnectionStateChangeCallback: ((state: RTCPeerConnectionState) => void) | null = null;
  private onIceCandidateCallback: ((candidate: RTCIceCandidate) => void) | null = null;
  private currentFacingMode: 'user' | 'environment' = 'user';

  constructor(
    onRemoteStream?: (stream: MediaStream) => void,
    onConnectionStateChange?: (state: RTCPeerConnectionState) => void,
    onIceCandidate?: (candidate: RTCIceCandidate) => void
  ) {
    if (onRemoteStream) this.onRemoteStreamCallback = onRemoteStream;
    if (onConnectionStateChange) this.onConnectionStateChangeCallback = onConnectionStateChange;
    if (onIceCandidate) this.onIceCandidateCallback = onIceCandidate;
  }

  // Ensure all media tracks are active and unmuted
  private ensureTracksActive(stream: MediaStream): void {
    stream.getTracks().forEach((track) => {
      track.enabled = true;
    });
  }

  // 1. Initialize Local Audio/Video Stream with Step-Down Progressive Fallbacks
  public async getLocalMedia(constraints?: MediaStreamConstraints): Promise<MediaStream> {
    if (this.localStream && this.localStream.active && !this.isAvatarMode) {
      return this.localStream;
    }

    const hasMediaDevices = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

    // ATTEMPT 1: High Definition Video + Crystal Clear Mic
    if (hasMediaDevices) {
      try {
        const hdConstraints: MediaStreamConstraints = constraints || {
          video: {
            width: { ideal: 1280, min: 320 },
            height: { ideal: 720, min: 240 },
            facingMode: this.currentFacingMode,
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        };
        const stream = await navigator.mediaDevices.getUserMedia(hdConstraints);
        this.ensureTracksActive(stream);
        this.localStream = stream;
        this.isAvatarMode = false;
        return this.localStream;
      } catch (err1) {
        console.warn('Attempt 1 (HD getUserMedia) failed, falling back to basic camera:', err1);
      }

      // ATTEMPT 2: Basic Camera Facing Mode + Standard Mic
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: this.currentFacingMode },
          audio: true,
        });
        this.ensureTracksActive(stream);
        this.localStream = stream;
        this.isAvatarMode = false;
        return this.localStream;
      } catch (err2) {
        console.warn('Attempt 2 (Basic facingMode) failed, falling back to simple video:', err2);
      }

      // ATTEMPT 3: Simple Bare Minimum Video + Mic
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        this.ensureTracksActive(stream);
        this.localStream = stream;
        this.isAvatarMode = false;
        return this.localStream;
      } catch (err3) {
        console.warn('Attempt 3 (Simple video) failed, attempting microphone-only + live avatar:', err3);
      }

      // ATTEMPT 4: Real Microphone Only + Animated Avatar Video Canvas Track
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: { echoCancellation: true, noiseSuppression: true },
        });
        const audioTrack = audioStream.getAudioTracks()[0];
        if (audioTrack) {
          audioTrack.enabled = true;
          // Generate avatar video canvas track
          const avatarStream = await this.getAvatarMedia('TIMEPASS Chatter');
          const syntheticAudio = avatarStream.getAudioTracks()[0];
          if (syntheticAudio) avatarStream.removeTrack(syntheticAudio);
          avatarStream.addTrack(audioTrack);
          this.localStream = avatarStream;
          this.isAvatarMode = true;
          return this.localStream;
        }
      } catch (err4) {
        console.warn('Attempt 4 (Microphone-only) failed or denied:', err4);
      }
    }

    // ATTEMPT 5: Virtual Avatar Mode (For Mobile HTTP LAN or Denied Permissions)
    // Ensures users on mobile phones or restricted origins NEVER get locked out!
    console.warn('Physical camera/mic inaccessible. Activating Live Animated Avatar Mode seamlessly.');
    const fallbackStream = await this.getAvatarMedia('TIMEPASS Chatter');
    this.localStream = fallbackStream;
    this.isAvatarMode = true;
    return this.localStream;
  }

  // 2. Initialize RTCPeerConnection
  public initPeerConnection(customIceServers?: RTCIceServer[]): RTCPeerConnection {
    this.closePeerConnection();

    const config: RTCConfiguration = {
      iceServers: customIceServers || DEFAULT_ICE_SERVERS,
      iceCandidatePoolSize: 10,
    };

    this.peerConnection = new RTCPeerConnection(config);
    this.remoteStream = new MediaStream();

    // Attach local tracks to peer connection
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        if (this.localStream && this.peerConnection) {
          this.peerConnection.addTrack(track, this.localStream);
        }
      });
    }

    // Remote tracks listener
    this.peerConnection.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        if (this.remoteStream) {
          // Avoid duplicate track insertion
          if (!this.remoteStream.getTracks().some(t => t.id === track.id)) {
            this.remoteStream.addTrack(track);
          }
        }
      });

      if (this.onRemoteStreamCallback && this.remoteStream) {
        this.onRemoteStreamCallback(this.remoteStream);
      }
    };

    // ICE Candidate generation
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.onIceCandidateCallback) {
        this.onIceCandidateCallback(event.candidate);
      }
    };

    // Peer connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      if (this.peerConnection && this.onConnectionStateChangeCallback) {
        this.onConnectionStateChangeCallback(this.peerConnection.connectionState);
      }
    };

    return this.peerConnection;
  }

  // 3. Create WebRTC SDP Offer (Initiator)
  public async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('PeerConnection not initialized');
    }
    const offer = await this.peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });
    await this.peerConnection.setLocalDescription(offer);
    return offer;
  }

  // 4. Create WebRTC SDP Answer (Receiver)
  public async createAnswer(offerSdp: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('PeerConnection not initialized');
    }

    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offerSdp));
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    return answer;
  }

  // 5. Handle Remote Answer
  public async handleRemoteAnswer(answerSdp: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) return;
    if (this.peerConnection.signalingState !== 'stable') {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answerSdp));
    }
  }

  // 6. Add Remote ICE Candidate
  public async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection) return;
    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.warn('Error adding ICE candidate:', err);
    }
  }

  // 7. Toggle Microphone Mute
  public toggleAudio(enabled?: boolean): boolean {
    if (!this.localStream) return false;
    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = enabled !== undefined ? enabled : !audioTrack.enabled;
      return audioTrack.enabled;
    }
    return false;
  }

  // 8. Toggle Camera On/Off
  public toggleVideo(enabled?: boolean): boolean {
    if (!this.localStream) return false;
    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = enabled !== undefined ? enabled : !videoTrack.enabled;
      return videoTrack.enabled;
    }
    return false;
  }

  // 9. Switch Camera (Facing Mode)
  public async switchCamera(): Promise<boolean> {
    if (!this.localStream) return false;
    this.currentFacingMode = this.currentFacingMode === 'user' ? 'environment' : 'user';

    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.stop();
      this.localStream.removeTrack(videoTrack);
    }

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: this.currentFacingMode },
        audio: false,
      });

      const newVideoTrack = newStream.getVideoTracks()[0];
      this.localStream.addTrack(newVideoTrack);

      // Replace track on peer connection
      if (this.peerConnection) {
        const sender = this.peerConnection.getSenders().find((s) => s.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(newVideoTrack);
        }
      }
      return true;
    } catch (err) {
      console.warn('Switch camera failed:', err);
      return false;
    }
  }

  // 10. Close Peer Connection (keeps local camera stream for fast NEXT matching)
  public closePeerConnection(): void {
    if (this.peerConnection) {
      this.peerConnection.ontrack = null;
      this.peerConnection.onicecandidate = null;
      this.peerConnection.onconnectionstatechange = null;
      this.peerConnection.close();
      this.peerConnection = null;
    }
    this.remoteStream = null;
  }

  // 11. Full Cleanup (stops camera/mic hardware and cancels avatar render loop)
  public stopAll(): void {
    if (this.avatarAnimationId !== null) {
      cancelAnimationFrame(this.avatarAnimationId);
      this.avatarAnimationId = null;
    }
    this.closePeerConnection();
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }
    this.isAvatarMode = false;
  }

  // 12. Create High-Definition Animated Avatar Stream
  public async getAvatarMedia(displayName: string = 'TIMEPASS User', avatarUrl?: string | null): Promise<MediaStream> {
    if (this.avatarAnimationId !== null) {
      cancelAnimationFrame(this.avatarAnimationId);
      this.avatarAnimationId = null;
    }
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }

    // 1. Acquire real microphone audio if permitted, else create valid WebRTC silent audio destination
    let audioTrack: MediaStreamTrack | null = null;
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        audioTrack = audioStream.getAudioTracks()[0] || null;
      } catch {
        // Microphone access denied or unavailable, proceed to synthetic audio baseline
      }
    }

    if (!audioTrack && typeof window !== 'undefined') {
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          const osc = audioCtx.createOscillator();
          const dst = audioCtx.createMediaStreamDestination();
          const gain = audioCtx.createGain();
          gain.gain.value = 0.0; // Silent baseline so WebRTC audio channel is negotiated properly
          osc.connect(gain);
          gain.connect(dst);
          osc.start();
          audioTrack = dst.stream.getAudioTracks()[0] || null;
        }
      } catch (err) {
        console.warn('AudioContext fallback warning:', err);
      }
    }

    // 2. Build 640x480 animated avatar canvas
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');

    let angle = 0;
    let imgObj: HTMLImageElement | null = null;
    if (avatarUrl) {
      imgObj = new Image();
      imgObj.crossOrigin = 'anonymous';
      imgObj.src = avatarUrl;
    }

    const drawFrame = () => {
      if (!ctx) return;
      angle += 0.04;

      // Dark futuristic gradient background
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, '#0a0a14');
      grad.addColorStop(0.5, '#190e2b');
      grad.addColorStop(1, '#09090f');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2 - 25;

      // Dual pulsing neon radar rings
      const pulse1 = Math.sin(angle) * 7;
      const pulse2 = Math.cos(angle * 1.2) * 10;

      ctx.beginPath();
      ctx.arc(cx, cy, 95 + pulse1, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(236, 72, 153, 0.35)';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, 80 + pulse2, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.55)';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Main Avatar Circle
      const diskGrad = ctx.createLinearGradient(cx - 65, cy - 65, cx + 65, cy + 65);
      diskGrad.addColorStop(0, '#ec4899');
      diskGrad.addColorStop(1, '#8b5cf6');
      ctx.beginPath();
      ctx.arc(cx, cy, 65, 0, Math.PI * 2);
      ctx.fillStyle = diskGrad;
      ctx.fill();

      // Draw avatar photo if loaded, or stylized uppercase initial
      if (imgObj && imgObj.complete && imgObj.naturalWidth > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, 63, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(imgObj, cx - 63, cy - 63, 126, 126);
        ctx.restore();
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 50px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const initial = (displayName || 'U').charAt(0).toUpperCase();
        ctx.fillText(initial, cx, cy);
      }

      // Online Green Indicator Dot
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(cx + 46, cy + 46, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // User Display Name
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(displayName || 'TIMEPASS Chatter', cx, cy + 115);

      // Subtitle
      ctx.fillStyle = '#f472b6';
      ctx.font = '13px sans-serif';
      ctx.fillText('🎭 Live Avatar Mode · Voice Active', cx, cy + 140);

      // Subtle dynamic audio equalizer bars
      const bars = 7;
      const barWidth = 6;
      const barGap = 4;
      const startX = cx - ((bars * barWidth + (bars - 1) * barGap) / 2);
      const baseY = cy + 165;
      for (let i = 0; i < bars; i++) {
        const height = Math.abs(Math.sin(angle * 2 + i * 0.8)) * 14 + 4;
        ctx.fillStyle = 'rgba(236, 72, 153, 0.7)';
        ctx.fillRect(startX + i * (barWidth + barGap), baseY - height, barWidth, height);
      }

      this.avatarAnimationId = requestAnimationFrame(drawFrame);
    };

    drawFrame();

    // 3. Capture Canvas Stream at 25 fps
    const captureStream = canvas.captureStream ? canvas.captureStream(25) : (canvas as unknown as { mozCaptureStream: (fps: number) => MediaStream }).mozCaptureStream(25);
    const videoTrack = captureStream.getVideoTracks()[0];

    const syntheticStream = new MediaStream();
    if (videoTrack) syntheticStream.addTrack(videoTrack);
    if (audioTrack) syntheticStream.addTrack(audioTrack);

    if (videoTrack) {
      const origStop = videoTrack.stop.bind(videoTrack);
      videoTrack.stop = () => {
        if (this.avatarAnimationId !== null) {
          cancelAnimationFrame(this.avatarAnimationId);
          this.avatarAnimationId = null;
        }
        origStop();
      };
    }

    this.localStream = syntheticStream;
    this.isAvatarMode = true;
    return this.localStream;
  }

  // 13. Switch from Avatar Mode to Real Camera
  public async switchToRealCamera(): Promise<boolean> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: this.currentFacingMode,
        },
        audio: true,
      });

      // Stop previous avatar animation & tracks
      if (this.avatarAnimationId !== null) {
        cancelAnimationFrame(this.avatarAnimationId);
        this.avatarAnimationId = null;
      }
      if (this.localStream) {
        this.localStream.getTracks().forEach((t) => t.stop());
      }

      this.localStream = stream;
      this.isAvatarMode = false;

      // Replace tracks in active peer connection
      if (this.peerConnection) {
        const newVideoTrack = stream.getVideoTracks()[0];
        const newAudioTrack = stream.getAudioTracks()[0];

        if (newVideoTrack) {
          const videoSender = this.peerConnection.getSenders().find((s) => s.track?.kind === 'video');
          if (videoSender) {
            videoSender.replaceTrack(newVideoTrack);
          } else {
            this.peerConnection.addTrack(newVideoTrack, stream);
          }
        }

        if (newAudioTrack) {
          const audioSender = this.peerConnection.getSenders().find((s) => s.track?.kind === 'audio');
          if (audioSender) {
            audioSender.replaceTrack(newAudioTrack);
          } else {
            this.peerConnection.addTrack(newAudioTrack, stream);
          }
        }
      }

      return true;
    } catch (err) {
      console.warn('Switch to real camera failed:', err);
      return false;
    }
  }
}
